package timer

import (
	"testing"
	"time"
)

// set general tick timeout of 2 seconds
const tickTimeout = 2 * time.Second

// waitForTick reports whether a tick arrives on ch within timeout.
	func waitForTick(ch <-chan time.Time, timeout time.Duration) (time.Time, bool) {
		select {
		case t := <-ch:
			return t, true
		case <-time.After(timeout):
			return time.Time{}, false
		}
	}
// drainTicks counts and removes every tick currently buffered on ch, without blocking.
		func drainTicks(ch <-chan time.Time) int {
			n := 0
			for {
				select {
				case <-ch:
					n++
				default:
					return n
				}
			}
		}

// Test that game clock is able perform and roate between pause, resume and stop events
func TestNewGameClock(t *testing.T) {
	tests := []struct {
		name  string
		check func(t *testing.T, gc *GameClock)
	}{
		{name: "Starting game state should be 'unpaused'",
			check: func(t *testing.T, gc *GameClock) {
				gc.Start()
				// isPaused should be false
				if gc.isPause {
					t.Errorf("Expect 'isPaused' to be:false but got 'isPaused=%T'", gc.isPause)
				}
				gc.SignalEvent(Stop)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.check(t, NewGameClock())
		})
	}
}

func TestPauseResume(t *testing.T) {
	tests := []struct {
		name string
		ops  []string
		want bool
	}{
		{name: "new clock is not paused", ops: nil, want: false},
		{name: "pause sets paused", ops: []string{"pause"}, want: true},
		{name: "resume clears paused", ops: []string{"pause", "resume"}, want: false},
		{name: "resume without pause is a no-op", ops: []string{"resume"}, want: false},
		{name: "repeated pause stays paused", ops: []string{"pause", "pause"}, want: true},
		{name: "pause after resume is paused again", ops: []string{"pause", "resume", "pause"}, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gc := NewGameClock()
			for _, op := range tt.ops {
				switch op {
				case "pause":
					gc.SignalEvent(Pause)
				case "resume":
					gc.SignalEvent(Resume)
				case "stop":
					gc.SignalEvent(Stop)
				default:
					t.Fatalf("unknown op %s", op)
				}
			}

			gc.mu.RLock()
			got := gc.isPause
			gc.mu.RUnlock()

			if got != tt.want {
				t.Errorf("isPause = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestTickDelivery(t *testing.T) {
	testCases := []struct {
		name     string
		before   []string // ops applied before Start
		after    []string // ops applied after Start
		wantTick bool
	}{
		{name:"running clock delivers a tick",wantTick: true},
		{name:"paused before start delivers no tick",before: []string{"pause"},wantTick: false},
		{name:"paused after start delivers no tick",after:[]string{"pause"},wantTick: false},
		{name:"resumed before first tick delivers a tick",before:[]string{"pause"},after: []string{"resume"},wantTick: true},
	}

	for _, tt := range testCases {
		t.Run(tt.name, func(t *testing.T) {
			gc := NewGameClock()
			defer gc.SignalEvent(Stop)
			for _, event :=range tt.before{
				switch(event){
					case "pause":
						gc.SignalEvent(Pause)
					case "resume":
						gc.SignalEvent(Resume)
					case "stop":
						gc.SignalEvent(Stop)
					default:
						t.Fatalf("unknown event %s", event)
				}
			}
			gc.Start()
			for _, event :=range tt.after{
				switch(event){
					case "pause":
						gc.SignalEvent(Pause)
					case "resume":
						gc.SignalEvent(Resume)
					case "stop":
						gc.SignalEvent(Stop)
					default:
						t.Fatalf("unknown event %s", event)
				}
			}
			_, got := waitForTick(gc.tickChan, tickTimeout)
			if got != tt.wantTick {
				t.Errorf("tick received = %v, want %v", got, tt.wantTick)
			}
		})
	}
}

func TestTickBuffer(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping timing test in short mode")
	}

	tests := []struct {
		name         string
		wait         time.Duration
		wantBuffered int
	}{
		{name: "no tick before the first interval", wait:500 * time.Millisecond, wantBuffered: 0},
		{name: "one tick is buffered", wait:1500 * time.Millisecond,wantBuffered:  1},
		{name: "extra ticks are dropped when unread", wait:2500 * time.Millisecond, wantBuffered: 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gc := NewGameClock()
			gc.Start()
			defer gc.SignalEvent(Stop)
			// wait for duration specified in test 
			time.Sleep(tt.wait)
      if got := drainTicks(gc.tickChan); got != tt.wantBuffered{
       	t.Errorf("Expected: %d, but received :%d", tt.wantBuffered, got)
      }
		})
	}
}

// Test stop timer workflows 
func TestStop(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping timing test in short mode")
	}

	tests := []struct {
		name      string
		start     bool
		tickFirst bool // wait for a tick before stopping
	}{
		{name:"stop before start does not panic", start:false, tickFirst:false},
		{name:"stop right after start", start:true, tickFirst:false},
		{name:"stop after the first tick", start:true,tickFirst:true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gc := NewGameClock()
			if tt.start {
				gc.Start()
			}
			if tt.tickFirst {
				if _, ok := waitForTick(gc.tickChan, tickTimeout); !ok {
					t.Fatal("expected a tick before Stop")
				}
			}

			gc.SignalEvent(Stop) // must not panic

			// remove any tick that was buffered before Stop
			drainTicks(gc.tickChan)

			if _, got := waitForTick(gc.tickChan, tickTimeout); got {
				t.Error("tick received after Stop")
			}
		})
	}
}


