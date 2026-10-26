package utils

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWriteJSON(t *testing.T) {
	tests := []struct {
		name   string
		status int
		data   any
		want   string
	}{
		{"ok with message", http.StatusOK, Envlope{"msg": "ok"}, "{\n \"msg\": \"ok\"\n}\n"},
		{"created with id", http.StatusCreated, Envlope{"id": 1}, "{\n \"id\": 1\n}\n"},
		{"empty map", http.StatusOK, Envlope{}, "{}\n"},
		{"nil data", http.StatusOK, nil, "null\n"},
		{"bad request with error", http.StatusBadRequest, Envlope{"error": "invalid"}, "{\n \"error\": \"invalid\"\n}\n"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()

			if err := WriteJSON(rec, tt.status, tt.data); err != nil {
				t.Fatalf("WriteJSON returned error: %v", err)
			}
			if rec.Code != tt.status {
				t.Errorf("status = %d, want %d", rec.Code, tt.status)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
				t.Errorf("Content-Type = %q, want %q", ct, "application/json")
			}
			if got := rec.Body.String(); got != tt.want {
				t.Errorf("body = %q, want %q", got, tt.want)
			}
		})
	}
}