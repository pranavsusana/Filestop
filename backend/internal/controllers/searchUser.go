package controllers

import (
	"encoding/json"
	"filestop-backend/internal/config"
	"filestop-backend/internal/models"
	"net/http"
	"sort"
)

func SearchUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")

	// Fetch all keys matching the prefix
	if query == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode([]models.SearchUser{})
		return
	}
	keys, err := config.Rdb.Keys(config.Ctx, query+"*").Result()
	if err != nil {
		http.Error(w, "error querying Redis", http.StatusInternalServerError)
		return
	}
	sort.Strings(keys)
	if len(keys) > 50 {
		keys = keys[:50]
	}

	users := make([]models.SearchUser, len(keys))
	for i, key := range keys {
		userJSON, err := config.Rdb.Get(config.Ctx, key).Result()
		if err != nil {
			http.Error(w, "error getting user ID from Redis", http.StatusInternalServerError)
			return
		}
		var user models.SearchUser
		if err := json.Unmarshal([]byte(userJSON), &user); err != nil {
			http.Error(w, "error unmarshalling user data", http.StatusInternalServerError)
			return
		}
		users[i] = user
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "error encoding response", http.StatusInternalServerError)
	}
}
