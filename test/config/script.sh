#!/bin/bash

sleep 5s

curl -b cookie.txt -c cookie.txt -X GET http://zway:8083/

curl -b cookie.txt -c cookie.txt -X GET http://zway:8083/smarthome/

curl -b cookie.txt -c cookie.txt -X GET http://zway:8083/ZAutomation/api/v1/system/first-access

curl -b cookie.txt -c cookie.txt -d '{"id":1,"password":"test123!.","passwordConfirm":"test123!.","email":""}' -H "Content-Type: application/json" -X PUT http://zway:8083/ZAutomation/api/v1/auth/update/1

curl -b cookie.txt -c cookie.txt -d '{"form":true, "login": "admin", "password": "test123!.", "keepme":false, "default_ui":1}' -H "Content-Type: application/json" -X PUT http://zway:8083/ZAutomation/api/v1/login



curl --header "Content-Type: application/json" \
  -b cookie.txt -c cookie.txt \
  --request PUT \
  --data '{"id":1,"password":"test123!.","passwordConfirm":"test123!.","email":""}' \
  http://zway:8083/ZAutomation/api/v1/auth/update/1

curl --header "Content-Type: application/json" \
  -b cookie.txt -c cookie.txt \
  --request POST \
  --data '{"form":true, "login": "admin", "password": "test123!.", "keepme":false, "default_ui":1}' \
  http://zway:8083/ZAutomation/api/v1/login

curl --header "Content-Type: application/json" \
  -b cookie.txt -c cookie.txt \
  --request POST \
  --data '{"instanceId":"0","moduleId":"DummyDevice","active":"true","title":"Dummy Device","params":{"deviceType":"switchBinary"}}' \
  http://zway:8083/ZAutomation/api/v1/instances

curl --header "Content-Type: application/json" \
  -b cookie.txt -c cookie.txt \
  --request POST \
  --data '{"instanceId":"0","moduleId":"SenergyConnector","active":"true","title":"SENERGY Connector","params":{"iot_repo_url":"'"$SENERGY_IOT"'","auth_url":"'"$SENERGY_AUTH"'","mqtt_url":"'"$SENERGY_MQTT"'", "user":"'"$SENERGY_USER"'", "password":"'"$SENERGY_PW"'"}}' \
  http://zway:8083/ZAutomation/api/v1/instances

tail -f /var/log/z-way-server.log
