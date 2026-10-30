package game_engine

import (
	"crypto"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/logic-gate-sys/wss_service/internals/events"
	engine "github.com/logic-gate-sys/wss_service/internals/word_engine"
)

// structs and interfaces
type Game struct {
	ID            int
	Players       []Player
	Letters       []LetterSet
	ActiveRoom    ActiveRoom
	Duration      time.Duration
	mux           sync.Mutex // controls data changes efficiently
	state         events.GameStateBroadcast
	CurrentWord   string
	ScrambledWord string
	wordEngine    *engine.WordEngine
}

// ActiveRoom
type ActiveRoom struct {
	ID         string `json:"id"` // ROOM ID 
	Players    []*Player
	LetterSet  *LetterSet
	UsedWords  map[string]int // word → name
	Scores     []Score   // name → their current score
	WordCounts map[int]int    // player id → accepted submissions
	StartedAt  time.Time         `json:"started_at"`
	Done       chan struct{}
	mu         sync.Mutex
}
type Reason string

const (
	ToJoinedClient    Reason = "ToJoinedClient"
	ToExistingClients Reason = "ToExistingClients"
)

type LetterSet struct {
	Letters    []string // e.g: ["T","A","R","E","S","N","I"]
	ValidWords []string // all words formable from these letters
}

type Player struct {
	ID       int    `json:"id"`
	UserName string `json:"user_name"`
	Send     chan struct{}
	Conn     *websocket.Conn
}

type Score struct {
	Id             int `json:"id"` // playerid 
	Name           string `json:"name"`
	CumlativeScore float32    `json:"cumlativeScore"`
}
type GameEngineInterface interface {
	UserScoreWord(word string, diff engine.Difficulty) (float32, error)
	ManageTimer()
}

func NewGame(roomId string) *Game {
	filePath := os.Getenv("DICTIONARY_FILEPATH")
	if filePath == "" {
		panic("Error! Invalid file path!")
	}
	return &Game{
		ID: crypto.BLAKE2b_256.Size(),
		ActiveRoom: ActiveRoom{
			ID:         roomId,
			Scores:     []Score{}, // scores of all players
			UsedWords:  make(map[string]int),
			WordCounts: make(map[int]int),
			Done:       make(chan struct{}),
		},
		// By default assuming duration per round is 60 seconds
		Duration:   60 * time.Second,
		state:      events.GameStateBroadcast{},
		wordEngine: engine.NewWordEngine(filePath),
	}
}

func (g *Game) StartRound() (string, error) {
	g.mux.Lock()
	defer g.mux.Unlock()

	letters, err := g.wordEngine.GenerateScramble()
	if err != nil {
		return "Error generate scramble", err
	}
	joinedLetters := strings.Join(letters, "")
	g.CurrentWord = joinedLetters
	g.ScrambledWord = joinedLetters
	g.ActiveRoom.UsedWords = make(map[string]int)
	g.ActiveRoom.WordCounts = make(map[int]int)
	return g.ScrambledWord, nil
}

func (g *Game) Reset() {
	g.mux.Lock()
	defer g.mux.Unlock()

	g.CurrentWord = ""
	g.ScrambledWord = ""
	g.ActiveRoom.UsedWords = make(map[string]int)
	g.ActiveRoom.Scores = []Score{} // scores of all players
	g.ActiveRoom.WordCounts = make(map[int]int)
}

// ScoreSubmission validates a word, rejects duplicate submissions for the
// current round, and updates the player's score in memory.
func (g *Game) ScoreSubmission(playerID int, word string, diff engine.Difficulty) (float32, error) {
	g.mux.Lock()
	defer g.mux.Unlock()

	word = strings.ToLower(strings.TrimSpace(word))
	if word == "" {
		
		return 0, nil
	}
	// if cannot build wors score 0
	if !canBuildWord(word, g.CurrentWord) {
		return 0, nil
	}
	// if already used , score 0
	if _, used := g.ActiveRoom.UsedWords[word]; used {
		return 0, nil
	}
	
	score, err := g.wordEngine.ScoreWord(word, diff)
	if err != nil || score == 0{
		return score, err
	}
	// update usedwords 
	g.ActiveRoom.UsedWords[word] = playerID
	for i := range g.ActiveRoom.Scores{
		if g.ActiveRoom.Scores[i].Id == int(playerID){
			g.ActiveRoom.Scores[i].CumlativeScore += score
			break
		}
	}
	g.ActiveRoom.WordCounts[playerID]++
	return score, nil
}

// canBuildWord: checks whether a player's submitted word can be legally built using
//  only the available pool of scrambled letters for that round. 
// It acts as a character-frequency validator (similar to Scrabble rules) 
func canBuildWord(word string, letters string) bool {
	available := make(map[rune]int)
	// count charactor frequency
	for _, letter := range strings.ToLower(letters) {
		available[letter]++
	}
	// compare each letter in submited word against the letter frequency map
	for _, letter := range word {
		if available[letter]==0 {
			return false
		}
		available[letter]--
	}
	return true
}

// This writes to db after the end of the game, this does not apply when play quits
func (g *Game) UpdatePlayerScore(playerId int, points float32) error {
	g.mux.Lock()
	defer g.mux.Unlock()
	for i := range g.ActiveRoom.Scores {
			if g.ActiveRoom.Scores[i].Id == playerId {
				g.ActiveRoom.Scores[i].CumlativeScore += points
				return nil
			}
		}
  return nil
}

// Generates In-Game status report after each round : does not retrive directly from db
func (g *Game) GenerateStatsReport() events.GameStateBroadcast {
	g.mux.Lock()
	defer g.mux.Unlock()

	return events.GameStateBroadcast{
		Which: events.ToJoinedClient,
		Data: events.GameStateData{
			RoomId: g.ActiveRoom.ID,
			Status: events.Playing,
			Scores: g.ActiveRoom.Scores,
		},
	}
}

// CurrentGameData fetches current game state data for a given room and return 
// the results as event.GameStateData.
func (g *Game) CurrentGameData(roomID string, round int, status events.Status, timeLeft int) events.GameStateData {
	g.mux.Lock()
	defer g.mux.Unlock()

	scores := make([]Score, len(g.ActiveRoom.Scores))
	_=copy(scores, g.ActiveRoom.Scores)
	wordCounts := make(map[string]int, len(g.ActiveRoom.WordCounts))
	for id, n := range g.ActiveRoom.WordCounts {
		wordCounts[strconv.Itoa(id)] = n
	}
	return events.GameStateData{
		RoomId:        roomID,
		Round:         round,
		Status:        status,
		TimeLeft:      timeLeft,
		ScrambledWord: g.ScrambledWord,
		Scores:        scores,
		WordCounts:    wordCounts,
	}
}


func (g *Game) AddPlayer(playerID int, name string) {
	g.mux.Lock()
	defer g.mux.Unlock()

	for _, s := range g.ActiveRoom.Scores {
		if s.Id == playerID {
			return
		}
	}
	g.ActiveRoom.Scores = append(g.ActiveRoom.Scores, Score{Id: playerID, Name: name})
}
