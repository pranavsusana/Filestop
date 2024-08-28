package helpers

import (
	"context"
	"net/http"
)

func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("token")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		tokenString := cookie.Value
		claims, err := ValidateJWT(tokenString)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := context.WithValue(r.Context(), "username", claims.Username)
		ctx = context.WithValue(ctx, "session", tokenString)
		next.ServeHTTP(w, r.WithContext(ctx))
		return

		// Check the token in Redis
		// sessionJSON, err := config.Rdb.Get(config.Ctx, "session:"+tokenString).Result()
		// if err == redis.Nil || err != nil {
		// }
		// var session models.Session
		// if err := json.Unmarshal([]byte(sessionJSON), &session); err != nil {
		// 	http.Error(w, "Unauthorized", http.StatusUnauthorized)
		// 	return
		// }
		// Set the username in the request context for further use
	})
}
