package controllers

import (
	"encoding/json"
	"filestop-backend/internal/config"
	"filestop-backend/internal/helpers"
	"filestop-backend/internal/models"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

type fileResponseData struct {
	ID         int64     `json:"id"`
	Uploader   string    `json:"uploader"`
	URI        string    `json:"uri"`
	UploadedAt time.Time `json:"uploaded_at"`
}

func GetFileData(w http.ResponseWriter, r *http.Request) {
	user := r.Context().Value("username").(string)
	vars := mux.Vars(r)
	filename := vars["filename"]
	file, err := models.GetFile(config.FileDB, filename)
	if err != nil {
		http.Error(w, "error fetching file data", http.StatusInternalServerError)
		return
	}
	_, err = helpers.ViewFile(user, file)
	if err != nil {
		http.Error(w, "no access", http.StatusForbidden)
		return
	}
	response := &fileResponseData{
		ID:         file.ID,
		Uploader:   file.Uploader,
		URI:        file.FilePath,
		UploadedAt: file.UploadedAt,
		// UploadedAt: time.Now(),
	}
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-type", "application/json")
	json.NewEncoder(w).Encode(response)
	return

}
