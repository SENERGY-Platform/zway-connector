var DEVICE_GROUP_TAG_KEY = "zway_device_group";

/*
    options: {
        url string,
        user string,
        pw string,
        getHash function([{uri string, iot_type string, name string, tags [string]}])string,
        getGatewayId function()string,
        saveGatewayId function(string),
        getDevices function()[{uri string, iot_type string, name string, tags [string]}],
        onCommand function({device_url string, service_url string, protocol_parts [{name string, value string}], <<1>>}, respond function(<<2>>))
        onStartupFinished function()
    }

    <<1>>: parts the user should ignore; this parts should be removed in the future (TODO)
    <<2>>: copy of input with changed protocol_parts, representing the result of the command operation (must currently contain <<1>>)

    to call on event: sendEvent(device_uri string, service_uri string, value [{name string, value string}], onsuccess function(), onerror function())
    to call when new device is added or device is changed: put({uri string, iot_type string, name string, tags [string]}, onsuccess function(), onerror function())
    to call when device is removed: remove(uri string, onsuccess function(), onerror function())
    commit to persist current connector state after a put or remove (use your getHash() function): commit(hash string, onsuccess function(), onerror function())
    get known devices with getKnownDevices(){<<uri>>:{}}

    onsuccess and onerror are optional
 */
var SeplConnectorClient = function(options) {
    console.log("SeplConnectorClient", JSON.stringify(options));
    var client = {
        options: options,
        ws: null,
        knownDevices: {}
    };

    client.com = SeplConnectorProtocol(client);

    client.getKnownDevices = function(){
        return client.knownDevices;
    };

    client._getDevices = function(){
        var devices = client.options.getDevices();
        devices.forEach(function(element){
            client.knownDevices[element.uri] = element;
        });
        return devices;
    };

    client.com.listen("command", function(message){
        options.onCommand(message.payload, function(result){
            client.com.send("response", result, null, function(msg){
                console.log("ERROR: command response error; ", JSON.stringify(result), " --> ", JSON.stringify(msg));
            });
        });
    });

    client.sendEvent = function(device_uri, service_uri, value){
        var event = {device_uri:device_uri, service_uri: service_uri, value: value};
        client.com.send("event", event, null, function(msg){
            console.log("ERROR: event error; ", JSON.stringify(event), " --> ", JSON.stringify(msg));
        });
    };

    client.currentStartTimeout = null;
    client.setStartTimeout = function(onFirstStart){
        client.stopStartTimeout();
        client.currentStartTimeout = setTimeout(function() {
            client.currentStartTimeout = null;
            if(client.ws && client.ws.close){
                client.ws.close();
            }
            client.ws = null;
            client.start(onFirstStart);
        }, 10000);
    };

    client.stopStartTimeout = function(){
        if(client.currentStartTimeout !== null){
            clearTimeout(client.currentStartTimeout);
        }
    };

    client.fatalCount=0;
    client.errorIsFatal = function(error){
        client.fatalLimit = 2;
        //zway-server specific error (TODO: move to index)
        if(error.data && error.data === "Could not contact DNS servers"){
            client.fatalCount++;
        }
        return client.fatalCount > client.fatalLimit;
    };

    client.start = function(){
        console.log("SeplConnectorClient.start()", JSON.stringify(client.options));

        if(client.ws != null){
            console.log("ERROR: ws not null --> not starting");
            return
        }

        //zway-server specific websocket (TODO: move to index)
        client.ws = new sockets.websocket(client.options.url);
        client.setStartTimeout();

        client.ws.onopen = function () {
            console.log('WebSocket Open');
            client.fatalCount = 0;
            client.stopStartTimeout();
            client._handshake();
        };

        client.ws.onclose = function(){
            console.log('WebSocket Closed');
            client.stopStartTimeout();
            client.ws = null;
            if(!client.stopWS){
                setTimeout(function () {
                    client.start();
                },10000);
            }
        };

        client.ws.onerror = function (error) {
            console.log('WebSocket Error', JSON.stringify(error));
            client.stopStartTimeout();
            client.ws.close();
            client.ws = null;
            if(client.errorIsFatal(error)){
                console.log("ERROR: is fatal; try z-way-server restart");
                setTimeout(function () {
                    system("/etc/init.d/z-way-server restart")
                }, 100);
                setTimeout(function () {
                    exit()
                }, 2000);
            }
            if(!client.stopWS){
                setTimeout(function () {
                    client.start();
                },10000);
            }
        };

        client.ws.onmessage = function(msg){
            client.com.handle(msg.data);
        };

    };

    client.stop = function(){
        console.log("SeplConnectorClient.stop()");
        client.stopStartTimeout()
        if (client.ws) {
            client.stopWS = true;
            client.ws.close();
        }
    };

    client._handshake = function(){
        var gatewayId = client.options.getGatewayId();
        client.com.listenOnce("response", "credentials", function (msg) {
            if(msg.status == 200){
                if(!msg.payload || !msg.payload.gid){
                    console.log("ERROR: invalid handshake response; ", JSON.stringify(msg));
                    client.ws.close();
                    return
                }
                if(msg.payload.gid != gatewayId || msg.payload.hash != client.options.getHash(client._getDevices())){
                    client.options.saveGatewayId(msg.payload.gid);
                    client.resetGateway();
                }else{
                    client.options.onStartupFinished();
                }
            }else{
                console.log("handshake error: ", JSON.stringify(msg))
            }
        });
        client.ws.send(JSON.stringify({user: client.options.user, pw: client.options.pw, token: "credentials", gid: gatewayId}));
    };


    client.resetGateway = function(){
        client.clear(function () {
            client._addDevices(client._getDevices(), 0)
        }, function(msg){
            console.log("ERROR while clear: ", JSON.stringify(msg));
            client.ws.close();
        });
    };

    client.clear = function(onsuccess, onerr){
        client.com.send("clear", null, function(msg){
            client.knownDevices = {};
            onsuccess(msg);
        }, onerr);
    };

    client.put = function(device, onsuccess, onerr){
        client.com.send("put", device, function(msg){
            client.knownDevices[device.uri] = device;
            onsuccess(msg);
        }, onerr);
    };

    client.remove = function(device, onsuccess, onerr){
        console.log("delete ", JSON.stringify(device));
        client.com.send("delete", device, function(msg){
            console.log("delete successfull");
            delete client.knownDevices[device];
            onsuccess(msg);
        }, onerr);
    };

    client._addDevices = function(devices, index){
        if(devices && devices.length > index){
            client.put(devices[index], function(){
                client._addDevices(devices, index+1);
            }, function(msg){
                console.log("ERROR while adding device: ", JSON.stringify(devices[index]), JSON.stringify(msg));
                client._addDevices(devices, index+1);
            });
        }else{
            client.commit(client.options.getHash(devices), function(){
                client.options.onStartupFinished();
            }, function(msg){
                console.log("ERROR on commit: ", JSON.stringify(msg));
            });
        }
    };

    client.commit = function(hash, onsuccess, onerr){
        client.com.send("commit", hash, onsuccess, onerr);
    };

    client.start();
    return client;
};
