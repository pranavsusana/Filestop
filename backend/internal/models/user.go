package models

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID               int      `json:"id"`
	Username         string   `json:"username"`
	Password         string   `json:"password"`
	Email            string   `json:"email"`
	PublicKey        string   `json:"public_key"`
	EncryptedPrivKey string   `json:"encrypted_priv_key"`
	SharedFiles      []string `json:"shared_files"`
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}
func UsernameTaken(db *sql.DB, username string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS (SELECT 1 FROM users WHERE username=$1)`
	err := db.QueryRow(query, username).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
func CreateUser(db *sql.DB, user *User) error {
	query := `INSERT INTO users (username, password, email, public_key, encrypted_priv_key) VALUES ($1, $2, $3, $4,$5)`
	_, err := db.Exec(query, user.Username, user.Password, user.Email, user.PublicKey, user.EncryptedPrivKey)
	return err
}

func GetUserByUsername(db *sql.DB, username string) (*User, error) {
	query := `SELECT id, username, password, email, public_key, encrypted_priv_key,shared_files FROM users WHERE username = $1`
	row := db.QueryRow(query, username)

	var user User
	var sharedFilesJSON []byte
	err := row.Scan(&user.ID, &user.Username, &user.Password, &user.Email, &user.PublicKey, &user.EncryptedPrivKey, &sharedFilesJSON)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	err = json.Unmarshal(sharedFilesJSON, &user.SharedFiles)
	if err != nil {
		return nil, fmt.Errorf("error unmarshaling shared files: %v", err)
	}
	return &user, nil
}
func UpdateSharedFiles(db *sql.DB, username string, fileURL string) error {
	query := `
		UPDATE users 
		SET shared_files = COALESCE(shared_files, '[]'::jsonb) || to_jsonb($1::text) 
		WHERE username = $2
	`
	_, err := db.Exec(query, fileURL, username)
	if err != nil {
		return fmt.Errorf("error updating shared files for user %s: %v", username, err)
	}
	return nil
}
