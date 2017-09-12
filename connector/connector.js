var DEVICE_GROUP_TAG_KEY = "zway_device_group";

var SeplConnectorClient = function(url, user, pw) {
    console.log("SeplConnectorClient(",url, user, pw,")");
    var client = {
        url : url,
        credentials: {user: user, pw: pw},
        devices: [],
        requestTimeout: null,
        firstStart: true
    };

    client.com = SeplConnectorProtocol(client);

    client.currentStartTimeout = null;
    client.setStartTimeout = function(onFirstStart){
        client.stopStartTimeout();
        client.currentStartTimeout = setTimeout(function() {
            client.currentStartTimeout = null;
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
        if(error.data && error.data === "Could not contact DNS servers"){
            client.fatalCount++;
        }
        return client.fatalCount > client.fatalLimit;
    };

    client.start = function(onFirstStart){
        console.log("SeplConnectorClient.start()");

        client.setStartTimeout(onFirstStart);
        client.ws = new sockets.websocket(client.url);

        client.ws.onopen = function () {
            console.log('WebSocket Open');
            client.fatalCount = 0;
            client.stopStartTimeout();
            client._handshake();
            if(onFirstStart && client.firstStart){
                client.firstStart = false;
                onFirstStart();
            }
        };

        client.ws.onclose = function(){
            console.log('WebSocket Closed');
            client.stopStartTimeout();
            client.ws = null;
            if(!client.stopWS){
                setTimeout(function () {
                    client.start(onFirstStart);
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
                //console.log("not implemented");
                setTimeout(function () {
                    system("/etc/init.d/z-way-server restart")
                }, 100);
                setTimeout(function () {
                    exit()
                }, 2000);
            }
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
            if (client.ws) {
                console.log("error on response: ", err);
                if (retrys && retrys > 0) {
                    client.sendResponse(resp, retrys - 1);
                }
            }
        }, client.requestTimeout)
    };

    client.sendEvent = function(device_uri, service_uri, value, retrys){
        client.com.send("event", JSON.stringify({device_uri:device_uri, service_uri: service_uri, value: value}), null, function(err){
            if (client.ws) {
                console.log("error on sendEvent: ", err);
                if(retrys && retrys > 0){
                    client.sendEvent(device_uri, service_uri, value, retrys-1);
                }
            }
        }, client.requestTimeout);
    };

    client.addDevices = function(newDevices, batchsize){
        client.devices = concatDistinct(client.devices, newDevices, function(device){return device.uri});
        if(!batchsize){
            batchsize = 5;
        }
        for(index=0; index<client.devices.length;){
            var urls = [];
            var max = index + batchsize;
            for (; index < max && index < client.devices.length; ++index) {
                urls.push(client.devices[index].uri);
            }
            client._addDevices(urls);
        }
    };

    client._addDevices = function(devices){
        console.log("addDevices() ", JSON.stringify(devices));
        client.com.send("listen_to_devices", JSON.stringify(devices), function(msg){
            console.log("debug: listen_to_devices result = ", msg);
            var response = JSON.parse(msg);
            client._createDevices(client.devices, response.unused);
            client._updateNames(client.devices,response.used);
            client._updateTags(client.devices,response.used);
        },function(err){
            if (client.ws) {
                console.log("error on addDevices: ", err)
            }
        }, client.requestTimeout);
    };

    client._updateNames = function(devices, usedDevices){
        var index = {};
        for (i = 0; i < devices.length; ++i) {
            index[devices[i].uri] = devices[i];
        }
        for (i = 0; i < usedDevices.length; ++i) {
            var device = index[usedDevices[i].uri];
            if(!(device && usedDevices[i])){
                console.log("WARNING: missing device in updateName (index=", i, "usedDevice=",usedDevices[i], "device=",device, ")")
            }else if(device.name != usedDevices[i].name){
                client.updateDeviceName(device.uri, device.name);
            }
        }
    };

    client._updateTags = function(devices, usedDevices){

        var mergeTags = function (local, global) {
            var result = {
                update: false,
                tags: []
            };
            var index = {};
            for (var i = 0; global && i < global.length; ++i) {
                var parts = global[i].split(":");
                var key = parts.shift();
                var value = "";
                if(parts.length > 0){
                    value = parts.join(":");
                }
                index[key] = value;
            }
            for (var i = 0; local && i < local.length; ++i) {
                var parts = local[i].split(":");
                var key = parts.shift();
                var value = "";
                if(parts.length > 0){
                    value = parts.join(":");
                }
                if(index[key] && index[key] != value){
                    result.update = true;
                }
                index[key] = value;
            }
            for (var key in index) {
                if (index.hasOwnProperty(key)){
                    var value = index[key];
                    result.tags.push(key+":"+value);
                }
            }
            return result;
        };

        var index = {};
        for (i = 0; i < devices.length; ++i) {
            index[devices[i].uri] = devices[i];
        }
        for (i = 0; i < usedDevices.length; ++i) {
            if(!(usedDevices[i] && usedDevices[i].uri && index[usedDevices[i].uri])){
                console.log("WARNING: missing device in updateName (index=", i, "usedDevice=",usedDevices[i], "device=",device, ")")
            }else{
                var device = index[usedDevices[i].uri];
                var merge = mergeTags(device.tags, usedDevices[i].tags);
                if(merge.update){
                    client.updateDeviceTags(device.uri, merge.tags);
                }
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
                if (client.ws) {
                    console.log("error on _createDevices: ", err);
                }
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
            if (client.ws) {
                console.log("error on updateDeviceName: ", err);
                if (retrys && retrys > 0) {
                    client.updateDeviceName(device_uri, newName, retrys - 1);
                }
            }
        }, client.requestTimeout);
    };

    client.updateDeviceTags = function(device_uri, tags, retrys){
        client.com.send("update_device_tags", JSON.stringify({device_uri:device_uri, tags: tags}), null, function(err){
            if (client.ws) {
                console.log("error on updateDeviceTags: ", err);
                if (retrys && retrys > 0) {
                    client.updateDeviceTags(device_uri, tags, retrys - 1);
                }
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