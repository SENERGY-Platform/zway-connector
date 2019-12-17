FROM golang:1.12


COPY . /go/src/mqtt-debuger
WORKDIR /go/src/mqtt-debuger

ENV GO111MODULE=on

RUN go build

EXPOSE 8080

CMD ./mqtt-debuger