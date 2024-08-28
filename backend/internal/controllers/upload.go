package controllers

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"filestop-backend/internal/config"
	"filestop-backend/internal/models"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

type EncryptedKey struct {
	Username        string `json:"username"`
	EncryptedSymKey string `json:"encryptedSymKey"`
}

type FileUploadRequest struct {
	File          []byte         `json:"file"`
	Metadata      string         `json:"metadata"`
	IV            string         `json:"iv"`
	EncryptedKeys []EncryptedKey `json:"encryptedKeys"`
	Uploader      string         `json:"uploader"`
}

type FileUploadResponse struct {
	URL string `json:"url"`
}

func UploadFile(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "unable to parse form", http.StatusBadRequest)
		return
	}
	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "unable to retrieve file", http.StatusBadRequest)
		return
	}
	defer file.Close()
	tempFile, err := os.CreateTemp(os.TempDir(), "upload-*.tmp")
	if err != nil {
		http.Error(w, "unable to create temporary file", http.StatusInternalServerError)
		return
	}
	defer os.Remove(tempFile.Name())

	urlPath := uuid.New().String()
	encryptedFilePath := filepath.Join("uploads", urlPath)

	symKey := make([]byte, 32) // AES-256
	if _, err := rand.Read(symKey); err != nil {
		http.Error(w, "error generating symmetric key", http.StatusInternalServerError)
		return
	}

	// Encrypt the file content

	dir := filepath.Dir(encryptedFilePath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.MkdirAll(dir, 0755); err != nil {
			http.Error(w, "error creating directory", http.StatusInternalServerError)
			return
		}
	}
	saveFile, err := os.Create(encryptedFilePath)
	_, err = io.Copy(saveFile, file)
	if err != nil {
		http.Error(w, "unable to save file", http.StatusInternalServerError)
		return
	}

	metadata := r.FormValue("metadata")
	iv := r.FormValue("iv")
	encryptedKeys := r.FormValue("encryptedKeys")
	uploader := r.FormValue("uploader")
	var encryptedKeysArr []EncryptedKey
	err = json.Unmarshal([]byte(encryptedKeys), &encryptedKeysArr)
	if err != nil {
		http.Error(w, "unable to parse encrypted keys", http.StatusBadRequest)
		return
	}

	uploadRequest := FileUploadRequest{
		Metadata:      metadata,
		IV:            iv,
		EncryptedKeys: encryptedKeysArr,
		Uploader:      uploader,
	}

	accessMap := make(map[string]string)
	for _, key := range uploadRequest.EncryptedKeys {
		accessMap[key.Username] = key.EncryptedSymKey
		err := models.UpdateSharedFiles(config.UserDB, key.Username, encryptedFilePath)
		if err != nil {
			http.Error(w, "unable to upload file", http.StatusInternalServerError)
			return
		}
	}
	savedFile := models.File{
		URLPath:           urlPath,
		FilePath:          encryptedFilePath,
		UploadedAt:        time.Now(),
		Uploader:          uploadRequest.Uploader,
		AccessMap:         accessMap,
		IV:                uploadRequest.IV,
		EncryptedMetadata: uploadRequest.Metadata,
	}

	if err := models.CreateFile(config.FileDB, &savedFile); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(FileUploadResponse{
		URL: encryptedFilePath,
	})
}

func encryptFileContent(content []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}

	return gcm.Seal(nonce, nonce, content, nil), nil
}
func encryptSymmetricKey(symKey []byte, publicKey string) (string, error) {
	// Decode the base64 encoded public key
	pubKeyPEM, err := base64.StdEncoding.DecodeString(publicKey)
	if err != nil {
		return "", fmt.Errorf("error decoding base64 public key: %v", err)
	}

	// Decode the PEM block
	block, _ := pem.Decode(pubKeyPEM)
	if block == nil {
		return "", fmt.Errorf("failed to decode PEM block containing public key")
	}

	// Parse the RSA public key
	pubKey, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("error parsing public key: %v", err)
	}

	// Encrypt the symmetric key
	encryptedBytes, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, pubKey.(*rsa.PublicKey), symKey, nil)
	if err != nil {
		return "", fmt.Errorf("error encrypting symmetric key: %v", err)
	}

	// Encode the encrypted symmetric key in base64
	return base64.StdEncoding.EncodeToString(encryptedBytes), nil
}
