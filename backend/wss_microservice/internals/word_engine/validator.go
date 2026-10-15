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
type ValidatorInterface interface{
	ValidateWord(word string, fileName string) (bool, error)
}


func NewValidator() Validator{
	return Validator{}
}

func (vdd * Validator) ValidateWord(word string, fileName string) (bool, error) {
	file, fileErr := dictionary.Words.Open(fileName)
	if fileErr != nil {
	   return false, fmt.Errorf("Failed to open text file. Error: %v", fileErr.Error())
	}
	defer file.Close()

	// channels for cordiantion
	scannedWords := make(chan string, 100) // streams text to all workers
	found := make(chan bool, 1)    // signifies word found or not
	quit := make(chan struct{})    // give and early quit to all workers

	// wait group
	var wg sync.WaitGroup
	//spawn five workers
	numWorkers := 5
	//TODO: Optimised routines to read from demacated locations in words channel, to make concurrency even faster
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
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
		}()
	}

	// stream text from file into job channel
	go func() {
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			select {
			case <-quit:
				break
				
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
