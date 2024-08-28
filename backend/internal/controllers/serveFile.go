package controllers

import (
	"filestop-backend/internal/config"
	"filestop-backend/internal/helpers"
	"filestop-backend/internal/models"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gorilla/mux"
)

func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	filename := vars["filename"]

	// Define the path to the uploads directory
	uploadDir := "./uploads"
	filePath := filepath.Join(uploadDir, filename)

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "file not found", http.StatusNotFound)
		return
	}
	file, err := models.GetFile(config.FileDB, filename)
	if err != nil {
		http.Error(w, "file not in database", http.StatusNotFound)
		return
	}
	username := r.Context().Value("username").(string)
	Key, err := helpers.ViewFile(username, file)
	if err != nil {
		http.Error(w, "no access", http.StatusForbidden)
		return
	}

	fileBytes, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "unable to read file", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Disposition", "attachment; filename="+file.URLPath)
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Length", strconv.Itoa(len(fileBytes)))
	w.Header().Set("X-File-Access-Key", Key)
	w.Header().Set("X-File-Metadata", file.EncryptedMetadata)
	w.Header().Set("IV", file.IV)
	// Write the file to the response
	w.Write(fileBytes)

	// Serve the file
}
func ServeMetadata(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	filename := vars["filename"]

	// Define the path to the uploads directory
	uploadDir := "./uploads"
	filePath := filepath.Join(uploadDir, filename)

	// Check if the file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "file not found", http.StatusNotFound)
		return
	}
	file, err := models.GetFile(config.FileDB, filename)
	if err != nil {
		http.Error(w, "file not in database", http.StatusNotFound)
		return
	}
	username := r.Context().Value("username").(string)
	Key, err := helpers.ViewFile(username, file)
	if err != nil {
		http.Error(w, "no access", http.StatusForbidden)
		return
	}

	w.Header().Set("X-File-Access-Key", Key)
	w.Header().Set("X-File-Metadata", file.EncryptedMetadata)
	w.Header().Set("IV", file.IV)

}
