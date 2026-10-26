package timer

import (
	"log"
	"sync"
	"time"
)

type event string
const (
	Stop   event = "STOP"
	Resume event = "RESUME"
	Pause  event = "PAUSE"
)

type GameClock struct {
	ticker   *time.Ticker
	tickChan chan time.Time
	stopChan chan struct{}
	isPause  bool
	mu       sync.RWMutex
}

func NewGameClock() *GameClock {
	return &GameClock{
		tickChan: make(chan time.Time, 1),
		stopChan: make(chan struct{}),
	}
}

// Start initiates the tick timer and sends the tick value to tickChan after each 1sec
// until a stop event is signalled. When a stop signal is given the function returns.
func (gc *GameClock) Start() {
	gc.ticker = time.NewTicker(1 * time.Second)

	go func() {
		// if a tick arrives on channel deliver it if game is not paused.
		for {
			select {
			case t := <-gc.ticker.C:
				gc.mu.RLock()
				isPaused := gc.isPause
				gc.mu.RUnlock()
				// no-blocking tick delivery
				if !isPaused {
					select {
					case gc.tickChan <- t:

					default:
					}
				}
			// else if a stop signal is sent, return
			case <-gc.stopChan:
				return
			}
		}
	}()
}

// Pause holds the timer running
func (gc *GameClock) SignalEvent(eventType event) {
	switch eventType {
	case Pause:
		gc.mu.Lock()
		gc.isPause = true
		gc.mu.Unlock()  
		
	case Resume:
		gc.mu.Lock()
		gc.isPause = false
		gc.mu.Unlock()
		
	case Stop:
		if gc.ticker != nil {
			gc.ticker.Stop()
		}
		close(gc.stopChan)
		return  
		
	default:
		log.Print("Invalid signal")
		return 
	}
}
