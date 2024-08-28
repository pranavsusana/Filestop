package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/jackc/pgx/v4/stdlib"
)

var UserDB *sql.DB
var FileDB *sql.DB

func ConnectUserDB() error {
	var err error
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		os.Getenv("USER_DB_USER"),
		os.Getenv("USER_DB_PASSWORD"),
		os.Getenv("USER_DB_HOST"),
		os.Getenv("USER_DB_PORT"),
		os.Getenv("USER_DB_NAME"),
	)
	UserDB, err = sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("error pinging the database: %w", err)
	}
	err = UserDB.Ping()
	if err != nil {
		return fmt.Errorf("error pinging the database: %w", err)
	}
	fmt.Println("Connected to the database successfully")
	createTableSQL := `
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	encrypted_priv_key BYTEA NOT NULL,
	public_key BYTEA NOT NULL,
	shared_files JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
	_, err = UserDB.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("error creating table: %w", err)
	}
	return nil
}
func ConnectFileDB() error {
	var err error
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		os.Getenv("FILE_DB_USER"),
		os.Getenv("FILE_DB_PASSWORD"),
		os.Getenv("FILE_DB_HOST"),
		os.Getenv("FILE_DB_PORT"),
		os.Getenv("FILE_DB_NAME"),
	)
	FileDB, err = sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("error pinging the database: %w", err)
	}
	err = FileDB.Ping()
	if err != nil {
		return fmt.Errorf("error pinging the database: %v", err)
	}
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS files (
	id SERIAL PRIMARY KEY,
	url_path TEXT NOT NULL,
	file_path TEXT NOT NULL,
	uploaded_at TIMESTAMP NOT NULL,
	uploader VARCHAR(255) NOT NULL,
	access_map JSONB NOT NULL,
	encrypted_metadata BYTEA NOT NULL,
	iv BYTEA NOT NULL
	);`
	_, err = FileDB.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("error creating table: %w", err)
	}

	fmt.Println("Connected to the database successfully")
	return nil
}
func CloseDBs() {
	if UserDB != nil {
		err := UserDB.Close()
		if err != nil {
			log.Printf("error closing user database connection: %v", err)
		}
	}

	if FileDB != nil {
		err := FileDB.Close()
		if err != nil {
			log.Printf("error closing file database connection: %v", err)
		}
	}
}
