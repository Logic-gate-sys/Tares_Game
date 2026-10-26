package engine

import (
	"bufio"
	"fmt"
	"math/rand/v2"
	"strings"
	"github.com/logic-gate-sys/wss_service/internals/dictionary"
)

type GameLetters struct{}
const dictionaryFile = "game_words.txt"
type GameLettersInterface interface{
	 GroupLetters() ([]string, error)
}

func NewGameLetters() *GameLetters{
	return &GameLetters{}
}

// Reads dictionary (using dictionaryWords func) , pick random words and turn it into a scramble letter. 
func (l *GameLetters) GroupLetters() ([]string, error) {
 words, err := dictionaryWords()
	if err != nil || len(words)==0 {
		return nil, err
	}
	
	word := words[rand.IntN(len(words))]
	letters := strings.Split(strings.ToUpper(word), "")
	rand.Shuffle(len(letters), func(i, j int) {
		letters[i], letters[j] = letters[j], letters[i]
	})

	return letters, nil
}


// Read embedded dictionary words and format int string arrays 
func dictionaryWords() ([]string, error) {
	file, err := dictionary.Words.Open(dictionaryFile)
	if err != nil {
		return nil, fmt.Errorf("Error loading embedded file: %w", err)
	}

	words := make([]string, 0)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		word := strings.ToLower(strings.TrimSpace(scanner.Text()))
		// add for words greater than 3  in length. 
		if len(word) >= 3 && len(word) <= 30 {
			words = append(words, word)
		}
	}
	// if scanner failed to read from file. 
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	
	return words, nil
}