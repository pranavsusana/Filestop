package controllers

import (
	"encoding/json"
	"filestop-backend/internal/config"
	"filestop-backend/internal/helpers"
	"filestop-backend/internal/models"
	"net/http"
)

type UserRegisterRequest struct {
	Username         string `json:"username"`
	Password         string `json:"password"`
	Email            string `json:"email"`
	PublicKey        string `json:"public_key"`
	EncryptedPrivKey string `json:"encrypted_priv_key"`
}
type UserRegisterResponse struct {
	Message string `json:"message"`
}

func RegisterUser(w http.ResponseWriter, r *http.Request) {
	var req UserRegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	usernameTaken, err := models.UsernameTaken(config.UserDB, req.Username)
	if err != nil {
		http.Error(w, "Error checking username availability", http.StatusInternalServerError)
		return
	}
	if usernameTaken {
		http.Error(w, "Username is already taken", http.StatusConflict)
		return
	}
	hashedPassword, err := helpers.HashPassword(req.Password)
	if err != nil {
		http.Error(w, "server Error while creating user", http.StatusInternalServerError)
		return
	}
	user := models.User{
		Username:         req.Username,
		Password:         hashedPassword,
		Email:            req.Email,
		PublicKey:        req.PublicKey,
		EncryptedPrivKey: req.EncryptedPrivKey,
	}
	err = models.CreateUser(config.UserDB, &user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	userdb, err := models.GetUserByUsername(config.UserDB, user.Username)
	if err != nil {
		http.Error(w, "server Error while creating user", http.StatusInternalServerError)
		return
	}
	usercache := models.SearchUser{
		ID:        userdb.ID,
		Username:  userdb.Username,
		PublicKey: userdb.PublicKey,
	}
	userJSON, err := json.Marshal(usercache)
	err = config.Rdb.Set(config.Ctx, user.Username, userJSON, 0).Err()
	if err != nil {
		http.Error(w, "server Error while creating user", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(UserRegisterResponse{Message: "User Registered Successfully"})
}
