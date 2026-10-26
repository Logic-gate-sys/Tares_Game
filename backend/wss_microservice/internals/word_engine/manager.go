package engine

import (
	"strings"
)



type Difficulty int

const (
	Easy  Difficulty = iota 
	Medium
	Hard
	Extreme
)

type MaxScore int
const (
	Amateur      MaxScore = 1
	Intermediate MaxScore = 2
	Expert       MaxScore = 3
)


type WordEngine struct{
	letterSet      *GameLetters // generate game letters
	validator       Validator  // validates word with dictionary content 
	FilePath string
}

type GameEngineInterface interface {
	ScoreWord(word string, diff Difficulty) (float32, error)
}

func NewWordEngine(filePath string) *WordEngine{
	return &WordEngine{
		validator: NewValidator(),
		letterSet: NewGameLetters(),
		FilePath: filePath, // dictionary file path
	}
}

// Validates words user submit and awards scores based on validity and difficulty level of word. 
func (we *WordEngine) ScoreWord(word string, diff Difficulty) (float32, error) {
	word = strings.ToLower(strings.TrimSpace(word))
	// empty strings is an automatic 0
	if word == "" { return 0, nil	}
	isValid, err := we.validator.ValidateWord(word, we.FilePath)
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


func (we *WordEngine)  GenerateScramble() ([]string, error) {
	letters, err := we.letterSet.GroupLetters()
	if err !=nil{
		return []string{}, err
	}

	return letters, nil 
}
