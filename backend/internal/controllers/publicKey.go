package controllers

import (
	"encoding/json"
	"filestop-backend/internal/config"
	"filestop-backend/internal/models"
	"net/http"

	"github.com/gorilla/mux"
)

func GetPublicKey(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")

	// Fetch all keys matching the prefix

	userJSON, err := config.Rdb.Get(config.Ctx, query).Result()
	if err != nil {
		http.Error(w, "error getting current user from Redis", http.StatusInternalServerError)
		return
	}
	var user models.SearchUser
	if err := json.Unmarshal([]byte(userJSON), &user); err != nil {
		http.Error(w, "error unmarshalling user data", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(user); err != nil {
		http.Error(w, "error encoding response", http.StatusInternalServerError)
	}
}
func GetPrivateKey(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	user := vars["username"]
	username, ok := r.Context().Value("username").(string)
	if !ok {
		http.Error(w, "username not found in context", http.StatusInternalServerError)
		return
	}
	if user != username {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	User, err := models.GetUserByUsername(config.UserDB, username)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	response := struct {
		EncryptedPrivKey string `json:"private_key"`
	}{
		EncryptedPrivKey: User.EncryptedPrivKey,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

}
