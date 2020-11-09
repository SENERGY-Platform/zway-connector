Modules.include("mqtt");

Modules.registerModule("connector", function (module) {
    return {
        connect: function (url, hubId, user, password, then, error, multiGatewayMode) {
            var result = {
                _connection: null,
                _commandHandlers: {},
                disconnect: function(){
                    throw "not implemented"
                },
                //handler = function(deviceLocalId string, serviceLocalId string, message map[string]string) => responseMessage map[string]string
                registerCommand: function (deviceLocalId, serviceLocalId, handler) {
                    throw "not implemented"
                },
                sendEvent: function (deviceLocalId, serviceLocalId, message, multiGatewayMode) {
                    throw "not implemented"
                }
            };

            result.disconnect = function(){
                try{
                    if(result._connection){
                        result._connection.disconnect();
                    }
                    result._connection = null;
                    result._commandHandlers = {};
                }catch (e) {
                    console.log("ERROR: while disconnecting connector", e, e.stack)
                }
            };

            //handler = function(deviceLocalId string, serviceLocalId string, message map[string]string) => responseMessage map[string]string
            result.registerCommand = function(deviceLocalId, serviceLocalId, handler){
                try{
                    if(!result._commandHandlers[deviceLocalId]){
                        result._commandHandlers[deviceLocalId] = {};
                    }
                    result._commandHandlers[deviceLocalId][serviceLocalId] = handler;
                    var err = result._connection.subscribe("command/"+deviceLocalId+"/"+serviceLocalId);
                    if(err.err){
                        console.log("ERROR: unable to subscribe to command", e, e.message, JSON.stringify(e), deviceLocalId, serviceLocalId);
                        return {err: err.err}
                    }
                }catch (e) {
                    console.log("ERROR: unable to register command", e, e.message, JSON.stringify(e), deviceLocalId, serviceLocalId);
                    return {err: "error: "+e.message}
                }
                return {}
            };

            //request = {"correlation_id":"","payload":{"segment":"string"},"timestamp":0,"completion_strategy":""}
            //response = {"segment":"string"}
            result._respond = function(deviceLocalId, serviceLocalId, request, response, trace){
                try{
                    var payload = {};
                    if (multiGatewayMode) {
                        console.log("DEBUG: Response is: ", response)
                        payload = {command_id: request.command_id, data: JSON.stringify(response)};
                    } else {
                        payload = {correlation_id: request.correlation_id, payload:{data: JSON.stringify(response)}, trace: trace};

                    }
                    var err = result._connection.send("response/"+deviceLocalId+"/"+serviceLocalId, JSON.stringify(payload));
                    if(err.err){
                        console.log("ERROR: while sending response", err.err, err.err.message, JSON.stringify(err.err), deviceLocalId, serviceLocalId);
                    }
                }catch (e) {
                    console.log("ERROR: unable to send response", e, e.message, JSON.stringify(e), deviceLocalId, serviceLocalId);
                }
            };

            //message = {"segment":"string"}
            result.sendEvent = function(deviceLocalId, serviceLocalId, message, multiGatewayMode){
                try{
                    payload = null
                    if (multiGatewayMode) {
                        payload = message
                    } else {
                        payload = {data: JSON.stringify(message)}
                    }
                    console.log("send event: ", deviceLocalId, serviceLocalId, JSON.stringify(payload));
                    var err = result._connection.send("event/"+deviceLocalId+"/"+serviceLocalId, JSON.stringify(payload));
                    if(err.err){
                        console.log("ERROR: while sending event", err.err, err.err.message, JSON.stringify(err.err), deviceLocalId, serviceLocalId);
                        return {err: err.err}
                    }
                }catch (e) {
                    console.log("ERROR: unable to send event", e, e.message, JSON.stringify(e), deviceLocalId, serviceLocalId);
                    return {err: "error: "+e.message}
                }
                return {}
            };

            //payload = {"correlation_id":"","payload":{"segment":"string"},"timestamp":0,"completion_strategy":""}
            result._handleCommand = function(topic, payload){
                console.log("DEBUG: _handleCommand = ",topic, payload);
                try {
                    var trace = []
                    trace.push({time_unit: 'unix_ms', timestamp: new Date().getTime(), location: 'github.com/SENERGY-Platform/zway-connector command received'})
                    var topicParts = topic.split("/");
                    var deviceLocalId = topicParts[1];
                    var serviceLocalId = topicParts[2];
                    var request = JSON.parse(payload);
                    if(!result._commandHandlers[deviceLocalId] || !result._commandHandlers[deviceLocalId][serviceLocalId]){
                        console.log("command not registered:", deviceLocalId, serviceLocalId);
                        return
                    }
                    var data = null;
                    if (multiGatewayMode) {
                        data = JSON.parse(request.data);
                    } else {
                        if (request.payload.data) {
                            data = JSON.parse(request.payload.data)
                        } else {
                            data = request;
                        }
                    }
                    trace.push({time_unit: 'unix_ms', timestamp: new Date().getTime(), location: 'github.com/SENERGY-Platform/zway-connector command parsed'})
                    var response = result._commandHandlers[deviceLocalId][serviceLocalId](deviceLocalId, serviceLocalId, data);
                    trace.push({time_unit: 'unix_ms', timestamp: new Date().getTime(), location: 'github.com/SENERGY-Platform/zway-connector command finished, answering'})
                    result._respond(deviceLocalId, serviceLocalId, request, response, trace);
                    console.log('DEBUG: original publish time/traces:\n', request.timestamp, '\n', JSON.stringify(trace));
                }catch (e) {
                    console.log("ERROR: unable to handle command", e, e.message, JSON.stringify(e), topic, payload)
                }
            };

            result._connection = Modules.get("mqtt").connect(
                url,
                hubId,
                user,
                password,
                true,
                function (connection, err) {
                    console.log("CONNECTOR DISCONNECTED", err);
                    error(result)
                }, function (connection) {
                    console.log("CONNECTOR CONNECTED");
                    then(result);
                }, function (connection, err) {
                    console.log("CONNECTOR ERROR", err);
                    error(result);
                }, function(connection, topic, payload){
                    result._handleCommand(topic, payload);
                },
                multiGatewayMode
            );
            if(result._connection.err){
                console.log("ERROR: unable to connect", result._connection.err);
                error(result);
                return {err: result._connection.err}
            }
        }
    };

});
