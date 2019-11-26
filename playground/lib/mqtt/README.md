ws based on:
 - https://github.com/hivemq/hivemq-mqtt-web-client 
 - https://raw.githubusercontent.com/hivemq/hivemq-mqtt-web-client/46338a633eb26bc9f6d8d8ff82f8f2aedc004a57/js/mqttws31.js

the mqtt-ws connection endpoint needs to be a proxy, that adds the mqtt 3.1 sub-protocol header to the request and relays the connection to a mqtt-broker.
the zway-plugin is not able to add this header itself.


tcp based on:
 - https://github.com/Edubits/Zway-MQTT
 - https://github.com/Edubits/Zway-MQTT/tree/b1311dc2fe723423d315c15ed7ed1d9705ca21df/lib
