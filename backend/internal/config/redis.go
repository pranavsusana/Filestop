package config

import (
	"context"
	"log"

	"github.com/go-redis/redis/v8"
)

var Rdb *redis.Client
var Ctx = context.Background()

func RedisStart() {
	Rdb = redis.NewClient(&redis.Options{
		Addr: "localhost:6379", // Use your Redis server address
		DB:   0,                // Use default DB
	})

	_, err := Rdb.Ping(Ctx).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}
}
