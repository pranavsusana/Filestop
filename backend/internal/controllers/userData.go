package controllers

import (
	"encoding/json"
	"filestop-backend/internal/config"
	"filestop-backend/internal/models"
	"net/http"

	"github.com/gorilla/mux"
)

type userResponseData struct {
	Username   string   `json:"username"`
	Email      string   `json:"email"`
	SharedFile []string `json:"shared_files"`
}

func GetUserData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	user := vars["username"]
	requestUser := r.Context().Value("username").(string)
	userData, err := models.GetUserByUsername(config.UserDB, user)
	if err != nil {
		http.Error(w, "user does not exist", http.StatusNotFound)
		return
	}
	if user != requestUser {
		response := &userResponseData{
			Username:   user,
			Email:      userData.Email,
			SharedFile: []string{},
		}
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}
	response := &userResponseData{
		Username:   user,
		Email:      userData.Email,
		SharedFile: userData.SharedFiles,
	}
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(response)
	return

}
