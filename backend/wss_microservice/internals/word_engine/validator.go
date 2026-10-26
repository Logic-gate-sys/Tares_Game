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

// Concurrently validates submitted word's correctness by comparing with the embeded dictionary words. 
// Does not score word, but returns a boolean indicating whether word is valid or not. 
func (vdd *Validator) ValidateWord(word string) (bool, error) {
	file, fileErr := dictionary.Words.Open(dictionaryFile)// text file has 200k+ words
	if fileErr != nil {
		return false, fmt.Errorf("Failed to open text file. Error: %v", fileErr.Error())
	}
	defer file.Close()

	// channels for cordiantion
	const batchSize int = 1000
	batches := make(chan []string, 20)     // make 20 batches each containing 1k words
	found := make(chan bool, 1)            // signifies word found or not
	quit := make(chan struct{})            // give and early quit to all workers
	var quitOnce sync.Once

  // A go routine to stream text from file into batches of []string each having 1k words shovelled into
	// the batches channel. 
	go func() {
		defer close(batches)
		
		scanner := bufio.NewScanner(file)
		batch := make([]string, 0, batchSize) // batch slice of size 1k 
		if err := scanner.Err(); err != nil {
			fmt.Printf("Failed to read from file: %v", err)
			return
		}
		
		for scanner.Scan() {
			batch = append(batch, scanner.Text())
			if len(batch) == batchSize {
				select{
					case <- quit:
					 return 
						
					case batches <- batch:
				}
				batch = make([]string, 0, batchSize) // make batch new and empty again 
			}
		  // for the last sets of words that may not be up to 1k 
		  if len(batch) > 0 {
					select{
						case <- quit:
						 return 
							
						case batches <- batch:
					}
				}
		}
	}()

	
	// wait group
	var wg sync.WaitGroup 
	for range FIVE_WORKERS {
		wg.Go(func() {
			// traverse batches
			for batch := range batches {
				// inspect each word in a batch 
				for _, wordInBatch := range batch{
					// if an unexpected quit signal is send , quit
					select{
						case <- quit:
						  return 
						default :
					} 
				// if word is found 
				 if strings.TrimSpace(wordInBatch) == word {
						select{
							case found <- true:
							default: 
						}
				// ensure quit can only be done onces 
					quitOnce.Do(func(){close(quit)})
					return 
					}
				}
				}
		})
	}

	

	// wait for all workers in seperate go routines to finish
	waitDone := make(chan struct{})
	go func() {
		wg.Wait()
		close(waitDone)
	}()

	select {
	case <- found:
		return true, nil

	case <- waitDone:
		return false, nil
	}

}
