package engine

import (
	"bufio"
	"fmt"
	"math/rand/v2"
	"strings"
	"github.com/logic-gate-sys/wss_service/internals/dictionary"
)

type GameLetters struct{}

type GameLettersInterface interface{
	 GroupLetters() ([]string, error)
}

func NewGameLetters() GameLetters{
	return GameLetters{}
}
// Reads dictionary , pick random words and turn it it a scramble letter. 
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


func dictionaryWords() ([]string, error) {
	content, err := dictionary.Words.ReadFile("words.txt")
	if err != nil {
		return nil, fmt.Errorf("failed to load embedded dictionary: %w", err)
	}

	words := make([]string, 0)
	scanner := bufio.NewScanner(strings.NewReader(string(content)))
	for scanner.Scan() {
		word := strings.ToLower(strings.TrimSpace(scanner.Text()))
		if len(word) >= 3 && len(word) <= 12 {
			words = append(words, word)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return words, nil
}