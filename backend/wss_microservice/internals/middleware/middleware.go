package middleware

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/logic-gate-sys/wss_service/internals/utils"
)

type AuthUser struct {
	ID          int
	Email       string
	Username    string
	Purpose     string
	PlayerLevel string
}
type UserMiddleware struct {
	secret []byte
}
type userKey string

const contextUserKey userKey = "user"

func NewUserMiddleware() (*UserMiddleware, error) {
	secret := os.Getenv("AUTH_SECRET")
	if len(secret) < 32 {
		return nil, errors.New("AUTH_SECRET must contain at least 32 characters")
	}
	return &UserMiddleware{secret: []byte(secret)}, nil
}

func SetUser(r *http.Request, user *AuthUser) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), contextUserKey, user))
}

func GetUser(r *http.Request) *AuthUser {
	user, _ := r.Context().Value(contextUserKey).(*AuthUser)
	return user
}

func (um *UserMiddleware) verify(tokenStr string) (*AuthUser, error) {
	parsed, err := jwt.Parse(tokenStr,
		func(t *jwt.Token) (any, error) { return um.secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, err
	}

	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	id, _ := claimInt(claims, "id")
	email, _ := claims["email"].(string)
	username, _ := claims["username"].(string)
	purpose, _ := claims["purpose"].(string)

	if id == 0 || email == "" || username == "" {
		return nil, errors.New("Invalid token claims")
	}
	// Replace "access" with the purpose value your Node service actually issues.
	if purpose != "authentication" {
		return nil, errors.New("invalid token purpose")
	}

	return &AuthUser{ID: id, Email: email, Username: username, Purpose: purpose}, nil
}

func bearerOrQueryToken(r *http.Request) (string, bool) {
	if header := r.Header.Get("Authorization"); header != "" {
		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" || parts[1] == "" {
			return "", false
		}
		return parts[1], true
	}
	// incase tokne is in the query string
	token := r.URL.Query().Get("token")
	return token, token != ""
}

func (um *UserMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, ok := bearerOrQueryToken(r)
		if !ok {
			utils.WriteJSON(w, http.StatusUnauthorized, utils.Envlope{"error": "Authorization is required"})
			return
		}
		user, err := um.verify(token)
		if err != nil {
			utils.WriteJSON(w, http.StatusUnauthorized, utils.Envlope{"error": "Invalid or expired token"})
			return
		}
		// next method
		next.ServeHTTP(w, SetUser(r, user))
	})
}

func (um *UserMiddleware) RequireAuth(next http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if GetUser(r) == nil {
			utils.WriteJSON(w, http.StatusUnauthorized, utils.Envlope{"error": "Authorization is required"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func claimInt(claims jwt.MapClaims, key string) (int, bool) {
	switch v := claims[key].(type) {
	case float64:
		return int(v), true
	case string:
		n, err := strconv.Atoi(v)
		return n, err == nil
	}
	return 0, false
}
