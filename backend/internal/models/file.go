package models

import (
	"database/sql"
	"encoding/json"
	"time"
)

// File represents the metadata and access information for an uploaded file.
type File struct {
	ID                int64             `json:"id"`
	URLPath           string            `json:"url_path"`
	FilePath          string            `json:"file_path"`
	UploadedAt        time.Time         `json:"uploaded_at"`
	Uploader          string            `json:"uploader"`
	AccessMap         map[string]string `json:"access_map"`
	EncryptedMetadata string            `json:"encrypted_metadata"`
	IV                string            `json:"iv"`
}

// CreateFile inserts a new file record into the database.
func CreateFile(db *sql.DB, file *File) error {
	accessMapJSON, err := json.Marshal(file.AccessMap)
	if err != nil {
		return err
	}
	query := `INSERT INTO files (url_path, file_path, uploaded_at, uploader, access_map, encrypted_metadata,iv) 
              VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`
	return db.QueryRow(query, file.URLPath, file.FilePath, file.UploadedAt, file.Uploader, accessMapJSON, file.EncryptedMetadata, file.IV).Scan(&file.ID)
}

// GetFile retrieves a file record from the database by its URL path.
func GetFile(db *sql.DB, urlPath string) (*File, error) {
	query := `SELECT id, url_path, file_path, uploaded_at, uploader, access_map, encrypted_metadata,iv FROM files WHERE url_path = $1`
	row := db.QueryRow(query, urlPath)

	var file File
	var accessMap []byte
	if err := row.Scan(&file.ID, &file.URLPath, &file.FilePath, &file.UploadedAt, &file.Uploader, &accessMap, &file.EncryptedMetadata, &file.IV); err != nil {
		return nil, err
	}

	// Unmarshal the JSON access map
	if err := json.Unmarshal(accessMap, &file.AccessMap); err != nil {
		return nil, err
	}

	return &file, nil
}
