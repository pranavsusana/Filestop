package models

type SearchUser struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	PublicKey string `json:"public_key"`
}
