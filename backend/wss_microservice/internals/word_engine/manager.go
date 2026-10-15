package engine

import (
	"strings"
)

type wordEngine struct{
	letterSet    GameLetters
	validator       Validator
}

type GameEngineInterface interface {
	UserScoreWord(word string, diff Difficulty) (float32, error)
	ManageTimer()
}

func NewWordEngine() *wordEngine{
	return &wordEngine{
		validator: NewValidator(),
		letterSet: NewGameLetters(),
	}
}

// Validates words user submit and awards scores based on validity and difficulty level of word. 
func (we *wordEngine) ScoreWord(word string, diff Difficulty) (float32, error) {
	word = strings.ToLower(strings.TrimSpace(word))
	if word == "" {
		return 0, nil
	}
	isValid, err := we.validator.ValidateWord(word, "words.txt")
	if err != nil || !isValid {
		return 0, err
	}
	// Return difficulty specific score 
	switch diff {
		case Easy:
			return float32(Amateur), nil
		case Medium:
			return float32(Intermediate), nil
		case Hard:
			return float32(Expert), nil
		case Extreme:
			return float32(2 * Expert), nil
		default:
			return 0, nil
	}
}

