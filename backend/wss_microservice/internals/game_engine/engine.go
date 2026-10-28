package game_engine

import (
	"crypto"
	"maps"
	"os"
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
	ID         string `json:"id"`
	Players    []*Player
	LetterSet  *LetterSet
	UsedWords  map[string]string // word → name
	Scores     map[string]int    // name → their current score
	WordCounts map[string]int    // player id → accepted submissions
	StartedAt  time.Time         `json:"started_at"`
	Done       chan struct{}
	mu         sync.Mutex
}
type Reason string
const (
	ToJoinedClient Reason ="ToJoinedClient"
	ToExistingClients Reason ="ToExistingClients"
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
			Scores:     make(map[string]int), // name -> scores of all players
			UsedWords:  make(map[string]string),
			WordCounts: make(map[string]int),
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

	// g.CurrentWord = strings.ToLower(word)
	g.ScrambledWord = strings.Join(letters, "")
	g.ActiveRoom.UsedWords = make(map[string]string)
	g.ActiveRoom.WordCounts = make(map[string]int)
	return g.ScrambledWord, nil
}

func (g *Game) Reset() {
	g.mux.Lock()
	defer g.mux.Unlock()

	g.CurrentWord = ""
	g.ScrambledWord = ""
	g.ActiveRoom.UsedWords = make(map[string]string)
	g.ActiveRoom.Scores = make(map[string]int)
	g.ActiveRoom.WordCounts = make(map[string]int)
}

// ScoreSubmission validates a word, rejects duplicate submissions for the
// current round, and updates the player's score in memory.
func (g *Game) ScoreSubmission(playerID string, word string, diff engine.Difficulty) (float32, error) {
	g.mux.Lock()
	defer g.mux.Unlock()

	word = strings.ToLower(strings.TrimSpace(word))
	if word == "" {
		return 0, nil
	}
	if !canBuildWord(word, g.CurrentWord) {
		return 0, nil
	}
	if _, used := g.ActiveRoom.UsedWords[word]; used {
		return 0, nil
	}

	score, err := g.wordEngine.ScoreWord(word, diff)
	if err != nil || score == 0 {
		return score, err
	}
	g.ActiveRoom.UsedWords[word] = playerID
	g.ActiveRoom.Scores[playerID] += int(score)
	g.ActiveRoom.WordCounts[playerID]++
	return score, nil
}

func canBuildWord(word string, letters string) bool {
	available := make(map[rune]int)
	for _, letter := range strings.ToLower(letters) {
		available[letter]++
	}
	for _, letter := range word {
		if available[letter] == 0 {
			return false
		}
		available[letter]--
	}
	return true
}

// This writes to db after the end of the game, this does not apply when play quits
func (g *Game) UpdatePlayerScore(playerId string, score float32) error {
	g.mux.Lock()
	defer g.mux.Unlock()

	g.ActiveRoom.Scores[playerId] += int(score)
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

// TODO: Game engine must only be responsible for game: word generation, scoring word.
// Fetches current game state data for a given room and return the results as event.GameStateData.
func (g *Game) CurrentGameData(roomID string, round int, status events.Status, timeLeft int, re Reason) events.GameStateData {
	g.mux.Lock()
	defer g.mux.Unlock()

	scores := make(map[string]int, len(g.ActiveRoom.Scores))
	wordCounts := make(map[string]int, len(g.ActiveRoom.WordCounts))
	maps.Copy(scores, g.ActiveRoom.Scores)
	maps.Copy(wordCounts, g.ActiveRoom.WordCounts)
	// to what effect is this beign requested
	if re ==ToJoinedClient {
		return events.GameStateData{
			RoomId: roomID,
			Status: status,
		}
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
