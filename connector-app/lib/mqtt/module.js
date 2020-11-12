(function () {

    /*
        onDisconnect: function(connection object, err any)
        onConnect: function(connection object)
        onError: function(connection object, err any)
        onMessage: function(connection object, topic string, payload string)
    */
    function connectTcp(mqttUrl, clientId, username, password, cleanSession, onDisconnect, onConnect, onError, onMessage, multiGatewayMode){
        if (!clientId || clientId === "") {
            clientId = "unknown-zway";
            console.log("WARN: No client id set. Using unknown-zway");
        }
        if(!sockets){
            return {err: "runtime-environment misses sockets"}
        }
        if(!sockets.tcp){
            return {err: "runtime-environment misses sockets.tcp"}
        }
        var result = {
            send: function (topic, msg) {
                throw "not implemented"
            },
            subscribe: function (topic, qos) {
                throw "not implemented"
            },
            disconnect: function () {
                throw "not implemented"
            }
        };

        const url = parseMqttUrl(mqttUrl);

        var host = url.hostname;
        var port = url.port;
        var keepAlive = 20;
        var cleanSession = true;

        result.disconnect = function () {
            try{
                console.log("MQTT DISCONNECT CALL");
                result.mqtt.onDisconnect(function () {console.log("DEBUG: close inception")});
                result.mqtt.close();
            }catch (e) {
                console.log("ERROR: while disconnecting mqtt", e, e.stack)
            }
        };

        result.subscribe = function(topic, qos){
            try{
                console.log("MQTT SUBSCRIBE", topic);
                result.mqtt.subscribe(topic,  {qos: qos}, function (topic, payload) {
                    try{
                        onMessage(result, topic.toString(), payload);
                    }catch (e) {
                        console.log("ERROR: unable to handle mqtt-tcp message", e, e.message, JSON.stringify(e))
                    }
                });
                return {}
            }catch (e) {
                return {err: e}
            }
        };

        result.send = function (topic, msg) {
            if(this.mqtt && this.mqtt.publish && this.mqtt.connected){
                try{
                    console.log("DEBUG: publish on mqtt:", topic, msg);
                    this.mqtt.publish(topic, msg.trim(), {qos_level: 0, retain: false});
                }catch (e) {
                    console.log("ERROR: unable to send tcp message", e, e.message, JSON.stringify(e), topic, msg);
                    return {err: e}
                }
            }else{
                console.log("WARNING: mqtt not connected; unable to send tcp message for", topic, msg);
                return {err: "mqtt not connected"}
            }
            return {}
        };

        var options = {
            client_id: clientId,
            will_flag: false,
            username: username,
            password: password,
            ping_interval: keepAlive*1000,
            ping_timeout: 60,
            connect_timeout: 60,
            clean_session: cleanSession,
            infoLogEnabled: false
        };

        if (multiGatewayMode) {
            var controllerId = global.ZWave && global.ZWave[ZWAY_MODULE_NAME] ? JSON.parse(global.ZWave[ZWAY_MODULE_NAME].Data("").body).controller.data.uuid.value : undefined;
             if (controllerId === undefined) {
                 console.log("WARN: No controller uuid set. Using unknown-zway");
                 controllerId = "unknown-zway";
             }
            options.will_flag = true;
            options.will_topic = "device/" +  controllerId  + "/lw";
            options.will_message = "0";
            options.client_id = clientId + new Date().getTime() + parseInt(Math.random() * 1000);
            options.ping_timeout = 300;
        }

        result.mqtt = new MQTTClient(host, port, options);
        result.mqtt.onLog(function (msg) { console.log("DEBUG: ", msg.toString()); });
        result.mqtt.onError(function (error) { onError(result, error.toString());});
        result.mqtt.onDisconnect(function () { onDisconnect(result); });
        result.mqtt.onConnect(function () { onConnect(result); });
        result.mqtt.connect();

        return result
    }

    Modules.registerModule("mqtt", function (module) {
        module.add("helper");
        module.add("buffer");
        module.add("localStorage");
        module.add("mqtt-tcp");

        return {
            connect: function (url, clientId, username, password, cleanSession, onDisconnect, onConnect, onError, onMessage, multiGatewayMode) {
                var urlObj = parseMqttUrl(url);
                if(!urlObj){
                    return {err: "unable to parse mqtt address"}
                }
                if(urlObj.protocol == "ws:" || urlObj.protocol == "wss:"){
                    return {err: "unable to handle mqtt by websocket"}
                }else if(urlObj.protocol == "tcp:") {
                    return connectTcp(url, clientId, username, password, cleanSession, onDisconnect, onConnect, onError, onMessage, multiGatewayMode);
                }else{
                    return {err: "unknown protocol: "+urlObj.protocol}
                }
            }
        }
    });

})();

