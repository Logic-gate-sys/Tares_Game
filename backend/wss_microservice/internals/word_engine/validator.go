package engine

import (
	"bufio"
	"fmt"
	"strings"
	"sync"

	"github.com/logic-gate-sys/wss_service/internals/dictionary"
)

// This spawns 5 goroutines each scanning job channels
// 1. 1 Go routine scan all words in text file and put the text in a job channel
// 2. 5 Go routines scan the job channel comparing each text with 'word'
// 3. Found channel signals an early return if word is found by any go routine scanning job channel
// 4  quit channel signals a final withrawal by the last job scanner

type Validator struct{}
type ValidatorInterface interface {
	ValidateWord(word string, fileName string) (bool, error)
}

type RoutineWorkers int

const (
	FIVE_WORKERS RoutineWorkers = 5
)

func NewValidator() Validator {
	return Validator{}
}

func (vdd *Validator) ValidateWord(word string, fileName string) (bool, error) {
	file, fileErr := dictionary.Words.Open("word.txt")
	if fileErr != nil {
		return false, fmt.Errorf("Failed to open text file. Error: %v", fileErr.Error())
	}
	defer file.Close()

	// channels for cordiantion
	scannedWords := make(chan string, 100) // streams text to all workers
	found := make(chan bool, 1)            // signifies word found or not
	quit := make(chan struct{})            // give and early quit to all workers

	// wait group
	var wg sync.WaitGroup
	//spawn five workers
	//TODO: Optimised routines to read from demacated locations in words channel, to make concurrency even faster
	for _ = range FIVE_WORKERS {
		wg.Add(1)
		wg.Go(func() {
			defer wg.Done()
			for current_word := range scannedWords {
				select {
				case <-quit:
					return

				default:
				}
				// validate word
				if strings.TrimSpace(current_word) == word {
					select {
					case found <- true:
						close(quit)

					default:
					}
					return
				}
			}
		})
	}

	// stream text from file into job channel
	go func() {
		scanner := bufio.NewScanner(file)
		err := scanner.Err()
		if err != nil {
			fmt.Printf("Failed to read from file: %v", err)
			return
		}
		for scanner.Scan() {
			select {
			case <-quit:
				return

			case scannedWords <- scanner.Text():
			}
		}
		close(scannedWords) // peacefully close job channel
	}()

	// wait for all workers in seperate go routines to finish
	waitDone := make(chan struct{})
	go func() {
		wg.Wait()
		close(waitDone)
	}()

	select {
	case <-found:
		return true, nil

	case <-waitDone:
		return false, nil
	}

}
