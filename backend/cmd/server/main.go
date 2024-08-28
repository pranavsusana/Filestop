package main

import (
	"filestop-backend/internal/config"
	"filestop-backend/internal/controllers"
	"filestop-backend/internal/helpers"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("error loading .env file %v", err)
	}
	if err := config.ConnectFileDB(); err != nil {
		log.Fatalf("failed to connect to file database: %v", err)
	}
	if err := config.ConnectUserDB(); err != nil {
		log.Fatalf("failed to connect to user database: %v", err)
	}
	defer config.CloseDBs()

	config.RedisStart()
	config.InitializeRedis()

	r := mux.NewRouter()

	r.Handle("/upload", helpers.JWTMiddleware(http.HandlerFunc(controllers.UploadFile))).Methods("POST")
	r.HandleFunc("/register", controllers.RegisterUser).Methods("POST")
	r.HandleFunc("/login", controllers.LoginUser).Methods("POST")
	r.Handle("/users", helpers.JWTMiddleware(http.HandlerFunc(controllers.SearchUsers))).Methods("GET")
	r.Handle("/publickey", helpers.JWTMiddleware(http.HandlerFunc(controllers.GetPublicKey))).Methods("GET")
	r.Handle("/uploads/{filename}", helpers.JWTMiddleware(http.HandlerFunc(controllers.ServeFile))).Methods("GET")
	r.Handle("/metadata/{filename}", helpers.JWTMiddleware(http.HandlerFunc(controllers.ServeMetadata))).Methods("GET")
	r.Handle("/privatekey/{username}", helpers.JWTMiddleware(http.HandlerFunc(controllers.GetPrivateKey))).Methods("GET")
	r.Handle("/profile/{username}", helpers.JWTMiddleware(http.HandlerFunc(controllers.GetUserData))).Methods("GET")
	r.Handle("/file/{filename}", helpers.JWTMiddleware(http.HandlerFunc(controllers.GetFileData))).Methods("GET")
	// staticDir := filepath.Join("..", "..", "..", "frontend", "build")
	// r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(staticDir, "static")))))
	//
	// r.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 	indexPath := filepath.Join(staticDir, "index.html")
	// 	http.ServeFile(w, r, indexPath)
	// })
	fmt.Println("Starting server on :3000...")
	log.Fatal(http.ListenAndServe(":3000", r))
}
