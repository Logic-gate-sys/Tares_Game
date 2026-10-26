
package store

import (
	"testing"
	"errors"
)

type ScoreReader interface {
	GetUserScoreByGame(userID string, gameID string) (*GameScore, error)
}

// in the test file
type fakeScoreReader struct {
	score *GameScore
	err   error
	// record calls so tests can check arguments
	gotUserID string
	gotGameID string
}

func (f *fakeScoreReader) GetUserScoreByGame(userID, gameID string) (*GameScore, error) {
	f.gotUserID = userID
	f.gotGameID = gameID
	return f.score, f.err
}


// fetchScore stands in for your service method. Replace it with
// NewService(...).Something(...) when that code exists.
func fetchScore(r ScoreReader, userID, gameID string) (float32, error) {
	s, err := r.GetUserScoreByGame(userID, gameID)
	if err != nil {
		return 0, err
	}
	if s == nil {
		return 0, errors.New("score not found")
	}
	return s.Score, nil
}

// Testing score fetching logic 
func TestFetchScore(t *testing.T) {
	tests := []struct {
		name    string
		reader  *fakeScoreReader
		want    float32
		wantErr bool
	}{
		{
			name:   "returns score",
			reader: &fakeScoreReader{score: &GameScore{Score: 9.5}},
			want:   9.5,
		},
		{
			name:   "returns zero score as a valid result",
			reader: &fakeScoreReader{score: &GameScore{Score: 0}},
			want:   0,
		},
		{
			name:    "propagates database error",
			reader:  &fakeScoreReader{err: errors.New("db down")},
			wantErr: true,
		},
		{
			name:    "nil score with no error is reported",
			reader:  &fakeScoreReader{},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := fetchScore(tt.reader, "u1", "g1")

			if (err != nil) != tt.wantErr {
				t.Fatalf("error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr && got != tt.want {
				t.Errorf("got %v, want %v", got, tt.want)
			}
			if tt.reader.gotUserID != "u1" || tt.reader.gotGameID != "g1" {
				t.Errorf("reader called with (%q, %q), want (%q, %q)",
					tt.reader.gotUserID, tt.reader.gotGameID, "u1", "g1")
			}
		})
	}
}