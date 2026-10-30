package ws

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
	"github.com/logic-gate-sys/wss_service/internals/events"
)

type client struct {
	name                 string // connect client's name
	UserId               int32
	socket               *websocket.Conn // socket connection by which the client communicates over the network
	inLobbyToClientEvent chan events.LobbyStateBroadcast
	inGameToClientEvent  chan events.GameStateBroadcast //messages going from server to client
	errorToClient        chan events.ErrorStateBroadcast
	room                 *GameRoom // Active game room client is currently connected to.
	manager              *roomManager
	pingStartedAt        atomic.Int64
	pingMilliseconds     atomic.Int64
	writeMux             sync.Mutex
}

func (c *client) Ping() int {
	return int(c.pingMilliseconds.Load())
}

// Take message in clients inbound channel and shovel it down to connected client sockect connection e.g browser
func (c *client) writeToClientPump() {
	// set up ticker channel
	ticker := time.NewTicker(10 * time.Second)
	defer c.socket.Close()
	defer ticker.Stop()
	lobbyEvents := c.inLobbyToClientEvent
	gameEvents := c.inGameToClientEvent
	errorEvents := c.errorToClient

	// sent all inbound events through socket
	for {
		if lobbyEvents == nil && gameEvents == nil {
			return
		}
		select {
		case <-ticker.C:
			c.pingStartedAt.Store(time.Now().UnixNano())
			if err := c.socket.WriteControl(websocket.PingMessage, nil, time.Now().Add(2*time.Second)); err != nil {
				return
			}

		case event, ok := <-gameEvents:
			// if manager closed in game to client channel
			if !ok {
				gameEvents = nil
				continue
			}
			jsonEvnt, err := json.Marshal(&event)
			if err != nil {
				fmt.Println("failed to marshal json")
				return
			}
			msg := events.RawMessage{MsgType: events.Ingame, RawJson: jsonEvnt}
			writer, err := c.socket.NextWriter(websocket.TextMessage)
			if err != nil {
				fmt.Println("Writer failed, connect again later")
				return
			}
			if err := json.NewEncoder(writer).Encode(&msg); err != nil {
				fmt.Printf("Failed to send broadcast message to client: %v", err)
				return
			}
			// close write to push data to client when done encoding
			writer.Close()

		// in a lobby broadcast comes in
		case event, ok := <-lobbyEvents:
			// if manager closes lobby To client channel
			if !ok {
				lobbyEvents = nil
				continue
			}
			jsonEvnt, err := json.Marshal(&event)
			if err != nil {
				fmt.Println("failed to marshal json")
				continue
			}
			msg := events.RawMessage{MsgType: events.Inlobby, RawJson: jsonEvnt}
			// attempt writting to client
			writer, err := c.socket.NextWriter(websocket.TextMessage)
			if err != nil {
				fmt.Println("Writer failed, please try and connect again")
				return
			}
			if err := json.NewEncoder(writer).Encode(msg); err != nil {
				fmt.Printf("Failed to send lobby broadcast message to client: %v", err)
			}
			// flush message to client
			fmt.Printf("Lobby event sent to client: %s", c.name)
			writer.Close()

		// error event
		case event, ok := <-errorEvents:
			// if manager closed error to client channel
			if !ok {
				errorEvents = nil
				continue
			}
			jsonEvnt, err := json.Marshal(&event)
			if err != nil {
				fmt.Println("failed to marshal json")
				return
			}
			msg := events.RawMessage{MsgType: events.Error, RawJson: jsonEvnt}
			writer, err := c.socket.NextWriter(websocket.TextMessage)
			if err != nil {
				fmt.Println("Writer failed, connect again later")
				return
			}
			if err := json.NewEncoder(writer).Encode(&msg); err != nil {
				fmt.Printf("Failed to send broadcast message to client: %v", err)
				return
			}
			// close write to push data to client when done encoding
			writer.Close()
		}
	}
}

// Read message from client e.g browser, sent it to inBoundEvents channel of room
func (c *client) readFromClientPump() {
	defer c.socket.Close()

	c.socket.SetPongHandler(func(string) error {
		startedAt := c.pingStartedAt.Load()
		if startedAt > 0 {
			c.pingMilliseconds.Store(time.Since(time.Unix(0, startedAt)).Milliseconds())
		}
		return nil
	})

	for {
		//blocks until a message arrives
		messageType, reader, err := c.socket.NextReader()
		if err != nil {
			// if the action is trigger intensionally by client e.g mount and unmounting if STRICT mode in react,etc
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, 1005) {
				fmt.Printf("Client %s cleanly disconnected or connection dropped by StrictMode.\n", c.name)
			} else {
				fmt.Printf("Reader failed abnormally for client %s: %v\n", c.name, err)
			}
			if c.room != nil {
				c.room.leave <- c
			}
			c.manager.lobbyLeave <- c
			return
		}

		if messageType != websocket.TextMessage {
			fmt.Println("Invalid message type")
			continue
		}
		// generic envlope to decode into first
		var msg events.RawMessage
		if err := json.NewDecoder(reader).Decode(&msg); err != nil {
			c.errorToClient <- events.ErrorStateBroadcast{
				Message: "Invalid json format. Could not decode data",
				Error:   err,
			}
			break
		}
		// switch
		switch msg.MsgType {
		case events.Inlobby:
			var inlobbyMsg events.InlobbyUserAction
			if err := json.Unmarshal(msg.RawJson, &inlobbyMsg); err != nil {
				c.errorToClient <- events.ErrorStateBroadcast{
					Message: "Invalid json format. Could not decode data",
					Error:   err,
				}
				break
			}
			// send to
			fmt.Printf("Event arrive at lobby door: %v", inlobbyMsg)
			c.manager.lobbyInbound <- LobbyAction{Client: c, Action: inlobbyMsg}

		// in game messsage to should go to room inbound channel
		case events.Ingame:
			var ingameMsg events.IngameUserAction
			if err := json.Unmarshal(msg.RawJson, &ingameMsg); err != nil {
				fmt.Printf("Failed to unmarshal ingame message: %v | RawJson: %s\n", err, string(msg.RawJson))
				c.errorToClient <- events.ErrorStateBroadcast{
					Message: "Failed to unmarshal ingame message",
					Error:   err,
				}
				break
			}
			fmt.Printf("Event arrive at game door: %+v\n", ingameMsg)
			ingameMsg.User = &events.Player{Id: strconv.Itoa(int(c.UserId)), Username: c.name}
			if c.room == nil {
				c.errorToClient <- events.ErrorStateBroadcast{
					Message: "You are not in a game room",
					Error:   errors.New("No room found for user"),
				}
				break
			}
			// put on ingame action
			c.room.inboundEvents <- ingameMsg

		default:
			c.errorToClient <- events.ErrorStateBroadcast{
				Message: "Invalid player action",
				Error:   errors.New("No match for action!"),
			}
		}
	}
}
