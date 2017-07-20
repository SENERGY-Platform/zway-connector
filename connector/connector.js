
var SeplConnectorClient = function(url, user, pw) {
    console.log("SeplConnectorClient(",url, user, pw,")");
    var client = {
        url : url,
        credentials: {user: user, pw: pw},
        devices: [],
        requestTimeout: 5000,
        firstStart: true
    };

    client.com = SeplConnectorProtocol(client);

    client.start = function(onFirstStart){
        console.log("SeplConnectorClient.start()");
        client.ws = new sockets.websocket(client.url);

        client.ws.onopen = function () {
            console.log('WebSocket Open');
            client._handshake();
            if(onFirstStart && client.firstStart){
                client.firstStart = false;
                onFirstStart();
            }
        };

        client.ws.onclose = function(){
            console.log('WebSocket Closed');
            client.ws = null;
            if(!client.stopWS){
                setTimeout(function () {
                    client.start(onFirstStart);
                },10000);
            }
        };

        client.ws.onerror = function (error) {
            console.log('WebSocket Error', JSON.stringify(error));
            client.ws = null;
            if(!client.stopWS){
                setTimeout(function () {
                    client.start(onFirstStart);
                },10000);
            }
        };

        client.ws.onmessage = function(msg){
            client.com.handle(msg.data);
        };

    };

    client.stop = function(){
        console.log("SeplConnectorClient.stop()");
        if (client.ws) {
            client.stopWS = true;
            client.ws.close();
        }
    };

    client._handshake = function(){
        client.com.listenOnce("error", "credentials", function (msg) {
            console.log("error on handshake: ", msg)
        });
        client.com.listenOnce("response", "credentials", function (msg) {
            console.log("successful handshake: ", msg)
        });
        client.ws.send(JSON.stringify({user: config.user, pw: config.password, token: "credentials"}));
        client.addDevices([]); //listen to same devices as before potential restart
    };

    client.onCommand = function(callback){
        client.com.listen("command", function(message, token){
            callback(JSON.parse(message));
        })
    };

    client.sendResponse = function(resp, retrys){
        client.com.send("response", JSON.stringify(resp), null, function(err){
            console.log("error on response: ", err);
            if(retrys && retrys > 0){
                client.sendResponse(resp, retrys-1);
            }
        }, client.requestTimeout)
    };

    client.sendEvent = function(device_uri, service_uri, value, retrys){
        client.com.send("event", JSON.stringify({device_uri:device_uri, service_uri: service_uri, value: value}), null, function(err){
            console.log("error on sendEvent: ", err);
            if(retrys && retrys > 0){
                client.sendEvent(device_uri, service_uri, value, retrys-1);
            }
        }, client.requestTimeout);
    };

    client.addDevices = function(newDevices){
        client.devices = concatDistinct(client.devices, newDevices, function(device){return device.uri});
        console.log("addDevices() ", JSON.stringify(client.devices));
        if(client.devices.length > 0){
            var urls = [];
            for (index = 0; index < client.devices.length; ++index) {
                urls.push(client.devices[index].uri);
            }
            client.com.send("listen_to_devices", JSON.stringify(urls), function(msg){
                console.log("debug: listen_to_devices result = ", msg);
                var response = JSON.parse(msg);
                client._createDevices(client.devices, response.unused);
                client._updateNames(client.devices,response.used);
            },function(err){
                console.log("error on addDevices: ", err)
            }, client.requestTimeout);
        }
    };

    client._updateNames = function(devices, usedDevices){
        var index = {};
        for (i = 0; i < devices.length; ++i) {
            index[devices[i].uri] = devices[i];
        }
        for (i = 0; i < usedDevices.length; ++i) {
            var device = index[usedDevices[i].device.uri];
            if(device.name != usedDevices[i].device.name){
                client.updateDeviceName(device.uri, device.name);
            }
        }
    };

    client._createDevices = function(devices, unusedUrls){
        console.log("debug: _createDevices = ", devices, unusedUrls);
        var toCreate = [];
        for (i = 0; i < devices.length; ++i) {
            for (j = 0; j < unusedUrls.length; ++j) {
                if(devices[i].uri == unusedUrls[j]){
                    toCreate.push(devices[i]);
                    break;
                }
            }
        }
        if(toCreate.length > 0){
            client.com.send("add_devices", JSON.stringify(toCreate), function(msg){
                console.log("newly created devices: ", msg);
            },function(err){
                console.log("error on _createDevices: ", err)
            }, client.requestTimeout);
        }
    };

    client.removeDevices = function(devices){
        console.log("not implemented: removeDevices()");
        //TODO
        /*
        if(devices.length > 0){
            for(i=0; i<devices.length; i++){
                client.devices.find(function(value, index) {
                    if(value.uri == devices[i].uri){
                        delete client.devices[index];
                        return
                    }
                });
            }
            client.com.send("remove_devices", JSON.stringify(devices));
        }
        */
    };

    client.muteDevices = function(devices){
        console.log("not implemented: removeDevices()");
        //TODO
    };

    client.updateDeviceName = function(device_uri, newName, retrys){
        client.com.send("update_device_name", JSON.stringify({device_uri:device_uri, name: newName}), null, function(err){
            console.log("error on updateDeviceName: ", err);
            if(retrys && retrys > 0){
                client.updateDeviceName(device_uri, newName, retrys-1);
            }
        }, client.requestTimeout);
    };


    return client;
};

function concatDistinct(listA, listB, idFunc) {
    var known = {};
    var result = [];
    for (i = 0; i < listA.length; ++i) {
        var element = listA[i];
        var id = idFunc(element);
        if(!known[id]){
            result.push(element);
            known[id] = element;
        }
    }
    for (i = 0; i < listB.length; ++i) {
        var element = listB[i];
        var id = idFunc(element);
        if(!known[id]){
            result.push(element);
            known[id] = element;
        }
    }
    return result;
}