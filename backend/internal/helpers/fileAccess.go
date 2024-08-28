package helpers

import (
	"errors"
	"filestop-backend/internal/models"
)

func ViewFile(username string, file *models.File) (string, error) {
	if encryptedKey, exists := file.AccessMap[username]; exists {
		return encryptedKey, nil
	}
	return "", errors.New("user has no access")
}
