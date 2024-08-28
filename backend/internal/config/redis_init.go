package config

import (
	"encoding/json"
	"filestop-backend/internal/models"
	"log"

	_ "github.com/jackc/pgx/v4/stdlib"
)

func InitializeRedis() {
	query := `SELECT id, username,public_key FROM users`

	rows, err := UserDB.Query(query)
	if err != nil {
		log.Fatalf("Error fetching users from database: %s", err)

	}
	defer rows.Close()

	for rows.Next() {
		var user models.SearchUser
		if err := rows.Scan(&user.ID, &user.Username, &user.PublicKey); err != nil {
			log.Fatalf("Error scanning user row: %s", err)
		}
		userJSON, err := json.Marshal(user)
		if err != nil {
			log.Fatalf("Error marshalling user to JSON: %s", err)
		}
		err = Rdb.Set(Ctx, user.Username, userJSON, 0).Err()
		if err != nil {
			log.Fatalf("Error indexing user in Redis: %s", err)
		}
	}
}
