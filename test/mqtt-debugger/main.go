package main

import (
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
)

func main(){
	port := flag.String("port", "8080", "port")
	flag.Parse()

	router := http.NewServeMux()
	router.HandleFunc("/publish", func(writer http.ResponseWriter, request *http.Request) {
		msg := PublishWebhookMsg{}
		err := json.NewDecoder(request.Body).Decode(&msg)
		if err != nil {
			log.Println("ERROR:", err)
		}
		payload, err := base64.StdEncoding.DecodeString(msg.Payload)
		log.Println("PUBLSIH:", msg.Topic, msg.Username, string(payload))
		_, err = fmt.Fprint(writer, `{"result": "ok"}`)

	})

	router.HandleFunc("/subscribe", func(writer http.ResponseWriter, request *http.Request) {
		msg := SubscribeWebhookMsg{}
		err := json.NewDecoder(request.Body).Decode(&msg)
		if err != nil {
			log.Println("ERROR:", err)
		}
		log.Println("SUBSCRIBE:", msg.Topics, msg.Username)
		_, err = fmt.Fprint(writer, `{"result": "ok"}`)
	})

	router.HandleFunc("/login", func(writer http.ResponseWriter, request *http.Request) {
		msg := LoginWebhookMsg{}
		err := json.NewDecoder(request.Body).Decode(&msg)
		if err != nil {
			log.Println("ERROR:", err)
		}
		log.Println("LOGIN:", msg.Username, msg.Password)
		_, err = fmt.Fprint(writer, `{"result": "ok"}`)
	})

	server := &http.Server{Addr: ":" + *port, Handler: router}
	log.Println("Listening on ", server.Addr)
	if err := server.ListenAndServe(); err != nil {
		log.Println("ERROR: unable to start server", err)
		log.Fatal(err)
	}
}