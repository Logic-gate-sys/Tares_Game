package ws

import (
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/logic-gate-sys/wss_service/internals/events"
	"github.com/logic-gate-sys/wss_service/internals/game_engine"
	"github.com/logic-gate-sys/wss_service/internals/store"
	"github.com/logic-gate-sys/wss_service/internals/timer"
	engine "github.com/logic-gate-sys/wss_service/internals/word_engine"
)

const (
	countdownSeconds = 15
	roundSeconds     = 60
	totalRounds      = 3
)
type RoomOption func(*GameRoom)
type Status string
const (
	Waiting  Status = "waiting"
	Playing  Status = "playing"
	Finished Status = "finished"
)

type GameRoom struct {
	Room           store.CreateRoom `json:"room"`
	Timer          timer.GameClock  `json:"timer"`
	Clients        map[*client]bool `json:"clients"`
	inboundEvents  chan events.IngameUserAction
	outBoundEvents chan events.GameStateBroadcast
	scrambledWord  string // current scramble
	wordCounts    map[string]int
	join          chan *client
	leave         chan *client
	gameEngine    *game_engine.Game
	startGame     chan bool
	stopGame      chan bool
	pauseGame     chan bool

	status     events.Status
	round      int
	timeLeft   int
	started    bool
	pausedFrom events.Status
}

// This runs the game logic. Integrated with game logic, scoring and ingame broadcasting capabilities,
// handles the life cycle of a game until game is over.
func (gr *GameRoom) Run() {
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()
	for {
		select {
		// client joins room inform other room members
		case c := <-gr.join:
			gr.Clients[c] = true
			c.room = gr
			if gr.status == "" {
				gr.status = events.Waiting
			}
		// trigger game engine to account for this player
			gr.gameEngine.AddPlayer(int(c.UserId), c.name)
			log.Printf("Client: %s joined Game-Room: %s", c.name, gr.Room.Name)
			
			gr.broadCastGameStateToClientNB(c, events.GameStateBroadcast{
				Which:   events.ToJoinedClient,
				Data:    gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
				Message: "Welcome to Arena",
			})
			for client := range gr.Clients {
				if client.UserId != c.UserId {
					gr.broadCastGameStateToClientNB(client, events.GameStateBroadcast{
						Which:   events.NewClientJoined,
						Data:    map[string]string{"name": c.name},
						Message: "New client joined room",
					})
				}
			}

		// when a client leaves arena put then in lobby
		case c := <-gr.leave:
			for client := range gr.Clients {
				if client.UserId != c.UserId {
					event := events.GameStateBroadcast{
						Which:   events.ClientLeft,
						Data:    map[string]string{"name": c.name},
						Message: "Client left room",
					}
					gr.broadCastGameStateToClientNB(client, event)
				}
			}
			delete(gr.Clients, c)
			c.room = nil
			log.Printf("Client left Game-Room: %s", gr.Room.Name)

		// client interactions: sending events into game room 
		case action := <-gr.inboundEvents:
			switch action.Action {
			case events.StartGame:
			// if starter is not owner, deny 
				if action.User == nil || action.User.Id != strconv.Itoa(gr.Room.OwnerId) {
					if action.User != nil {
						for client := range gr.Clients {
							if strconv.Itoa(int(client.UserId)) == action.User.Id {
								event := events.GameStateBroadcast{
									Which:   events.ToJoinedClient,
									Data:    gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
									Message: "Only the room owner can start the game",
								}
								gr.broadCastGameStateToClientNB(client, event)
							}
						}
					}
					break
				}
				// if game has already started, pass 
				if gr.started {
					for client := range gr.Clients {
						if strconv.Itoa(int(client.UserId)) == action.User.Id {
							event := events.GameStateBroadcast{
								Which:   events.ToJoinedClient,
								Data:    gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
								Message: "The game has already started",
							}
							gr.broadCastGameStateToClientNB(client, event)
						}
					}
					break
				}
        // start game 
				gr.started = true
				gr.round = 1
				gr.status = events.Countdown
				gr.timeLeft = countdownSeconds
				_, err := gr.gameEngine.StartRound()
				if err != nil {
					log.Printf("Failed to start round %s: %v", gr.Room.Id, err)
					gr.started = false
					continue
				}
        // broadcast state to all connected clients
				for client := range gr.Clients {
					event := events.GameStateBroadcast{
						Which:   events.GameStarted,
						Data:    gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
						Message: "Game starting",
					}
					gr.broadCastGameStateToClientNB(client, event)
				}

			case events.PauseGame, events.ResumeGame:
				if action.User == nil || action.User.Id != strconv.Itoa(gr.Room.OwnerId) {
					continue
				}
				if action.Action == events.PauseGame && gr.started &&
					gr.status != events.Finished && gr.status != events.Pause {
					gr.pausedFrom = gr.status
					gr.status = events.Pause
				} else if action.Action == events.ResumeGame && gr.status == events.Pause {
					gr.status = gr.pausedFrom
				}
				for client := range gr.Clients {
					event := events.GameStateBroadcast{
						Which:   events.ToJoinedClient,
						Data:    gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
						Message: "Game state updated",
					}
					gr.broadCastGameStateToClientNB(client, event)
				}

			case events.RestartGame:
				if action.User == nil || action.User.Id != strconv.Itoa(gr.Room.OwnerId) ||
					gr.status != events.Finished {
					continue
				}
				gr.gameEngine.Reset()
				gr.started = false
				gr.round = 0
				gr.timeLeft = 0
				gr.status = events.Waiting
				for client := range gr.Clients {
					event := events.GameStateBroadcast{
						Which:   events.ToJoinedClient,
						Data:    gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
						Message: "New match ready. The room owner can start the game.",
					}
					gr.broadCastGameStateToClientNB(client, event)
				}

			case events.LeaveGame:
				if action.User == nil {
					continue
				}
				for client := range gr.Clients {
					if strconv.Itoa(int(client.UserId)) == action.User.Id {
						for otherClient := range gr.Clients {
							if otherClient.UserId != client.UserId {
								event := events.GameStateBroadcast{
									Which:   events.ClientLeft,
									Data:    map[string]string{"name": client.name},
									Message: "Client left room",
								}
								gr.broadCastGameStateToClientNB(otherClient, event)
							}
						}
						delete(gr.Clients, client)
						client.room = nil
						client.manager.lobbyJoin <- client
						break
					}
				}

			case events.SendWord:
				if gr.status == events.Playing && action.User != nil {
					// extract word from action 
					word, ok := action.Value["word"].(string)
					fmt.Printf("WORD RECEIVED: %s", word)
					if !ok {continue}
					//increating order of difficulty peer round 
					difficulty := engine.Easy
					switch gr.round {
					case 2:
						difficulty = engine.Medium
					case 3:
						difficulty = engine.Hard
					}
					// retrieve user id from action 
					id, err := strconv.Atoi(action.User.Id)
					if err != nil{
						log.Printf("Failed to score word in room %s: %v", gr.Room.Id, err)
						continue
					}
					score, err := gr.gameEngine.ScoreSubmission(id, word, difficulty)
					if err != nil {
						log.Printf("Failed to score word in room %s: %v", gr.Room.Id, err)
						continue
					}
					if score == 0 {
						continue
					}
					// send score updates of to clients 
					for client := range gr.Clients {
						event := events.GameStateBroadcast{
							Which: events.WordSubmitted,
							Data: struct{ 
								Id   string     `json:"id"`
								Name string  `json:"name"`
								Word  string `json:"word"`
								Score int    `json:"score"`
								State  any   `json:"state"`
							}{
								Id: action.User.Id, 
								Name: action.User.Username,
								Word: word,
								Score: int(score),
								State: gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
							},
							Message: fmt.Sprintf("%s unscrambled %s", action.User.Username, word),
						}
						gr.broadCastGameStateToClientNB(client, event)
					}
					// 
					// for client := range gr.Clients {
					// 	event := events.GameStateBroadcast{
					// 		Which:   events.ToJoinedClient,
					// 		Data:    gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
					// 		Message: "Word received",
					// 	}
					// 	gr.broadCastGameStateToClientNB(client, event)
					// }
				}
				
			case events.StopGame:
				return
			}

		// when a time arrives via the ticker channel
		case <-ticker.C:
			if !gr.started || gr.status == events.Finished || gr.status == events.Pause {
				continue
			}
			if gr.timeLeft > 0 {
				gr.timeLeft--
			}
			if gr.timeLeft == 0 {
				switch gr.status {
				case events.Countdown:
					gr.status = events.Playing
					gr.timeLeft = roundSeconds

				case events.Playing:
					if gr.round == totalRounds {
						gr.status = events.Finished

					} else {
						gr.status = events.RoundOver
						gr.timeLeft = countdownSeconds
					}

				case events.RoundOver:
					gr.round++
					gr.status = events.Countdown
					gr.timeLeft = countdownSeconds
					if _, err := gr.gameEngine.StartRound(); err != nil {
						log.Printf("Failed to start a new round for room")
						gr.status = events.Waiting
					}
				}
			}
			// broadcast all ticks to clients connected
			for client := range gr.Clients {
				gr.broadCastGameStateToClientNB(client, events.GameStateBroadcast{
					Which:   events.ToJoinedClient,
					Data:    gr.gameEngine.CurrentGameData(gr.Room.Id, gr.round, gr.status, gr.timeLeft),
					Message: "Game state updated",
				})
			}
		}
	}
}

// Broadcasts game state to a connected client non-blockingly.
// Tries to send the event immediately. If inGameToClientEvent chan is full (or if no receiver is
// listening on the unbuffered channel),
// Go jumps straight to the default block without pausing execution
func (gr *GameRoom) broadCastGameStateToClientNB(c *client, event events.GameStateBroadcast) {
	select {
	case c.inGameToClientEvent <- event:

	default:
		log.Printf("Dropping game event for client %s", c.name)
	}
}
