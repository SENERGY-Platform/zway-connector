
function SenergyConnector (id, controller) {
    SenergyConnector.super_.call(this, id, controller);
}

inherits(SenergyConnector, AutomationModule);
_module = SenergyConnector;


const SenergyClientId = "client-connector-lib";


SenergyConnector.prototype.init = function (config) {
    console.log("Init SenergyConnector");
    SenergyConnector.super_.prototype.init.call(this, config);
    this.config = JSON.parse(JSON.stringify(config));
    var parsedUrl = parseUrl(this.config.mqtt_url);
    if(!parsedUrl){
        console.log("ERROR: unable to parse mqtt address", this.config.mqtt_url);
        return
    }
    this.config.protocol = parsedUrl.protocol;

    executeFile("userModules/SenergyConnector/hash.js");
    executeFile("userModules/SenergyConnector/reg.js");
    executeFile("userModules/SenergyConnector/mqtt/ws.js");
    executeFile("userModules/SenergyConnector/mqtt/tcp.js");
    executeFile("userModules/SenergyConnector/provisioning.js");
    executeFile("userModules/SenergyConnector/zwayhelper.js");

    var that = this;
    setTimeout(function(){that.start()}, 20000)
};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    this.unwatchMetrics();
    SenergyConnector.super_.prototype.stop.call(this);
};

SenergyConnector.prototype.start = function () {
    console.log("Start SenergyConnector");
    this.reg = new Reg();
    this.provisioning();
    var that = this;
    setInterval(function(){
        try{
            that.provisioning();
        }catch (e) {
            console.log("ERROR: start::provisioning ", e, e.message);
        }
    }, 15000);
    this.watchMetrics();
};

SenergyConnector.prototype.provisioning = function () {
    var that = this;
    if(that.provisioningLock){
        console.log("DEBUG: provisioning is running...");
        return
    }
    that.provisioningLock = true;
    try{
        var config = this.config;
        var devices = getZwayDevices(this.controller);
        var diff = this.reg.diff(devices);
        if(diff){
            console.log("DEBUG: update provisioning");
            var result = login(config.auth_url, SenergyClientId, config.user, config.password);

            if(result.err){
                that.provisioningLock = false;
                console.log("login error:", JSON.stringify(result.err));
                return
            }
            var token = result.token;
            provisionHub(config.iot_repo_url, token, "", devices, hubIdProvider, function(result){
                if(result.err){
                    that.provisioningLock = false;
                    console.log("ERROR: provisioning error:", JSON.stringify(result.err));
                    return
                }
                console.log("DEBUG:",  JSON.stringify(diff));
                if(diff.removed && diff.removed.length){
                    result = removeDevices(config.iot_repo_url, token, diff.removed);
                    if(result.err){
                        that.provisioningLock = false;
                        console.log("ERROR: removeDevices():", JSON.stringify(result.err));
                        return
                    }
                }
                that.reg.set(devices, diff.newHash);
                that.updateConnection(devices);
                that.provisioningLock = false;
            });
        }else{
            that.provisioningLock = false;
        }
    }
    catch (e) {
        that.provisioningLock = false;
        console.log("ERROR: catch:", e, e.stack)
    }
};

SenergyConnector.prototype.updateConnection = function (devices) {
    if(this.config.protocol == "ws:" || this.config.protocol == "wss:"){
        return this.updateConnectionWs(devices);
    }else if(this.config.protocol == "tcp:") {
        return this.updateConnectionTcp(devices);
    }else{
        console.log("ERROR: unknown protocol", this.config.protocol);
    }
};

SenergyConnector.prototype.sendCommandToZway = function(id, command, metrics){
    console.log("DEBUG: command to zway: ", id, command, metrics);
    var device = this.controller.devices.get(id);
    if(device){
        if(command == "sepl_get"){
            return JSON.stringify(getMetrics(device))
        }else if(command == "sepl_get_level"){
            return JSON.stringify(getMetricsLevel(device))
        }else{
            device.performCommand(command, metrics);
        }
    }
    return null;
};

SenergyConnector.prototype.sendEvent = function(deviceUri, serviceUri, payload){
    this.send("event/"+deviceUri+"/"+serviceUri, JSON.stringify({metrics: payload}));
};

SenergyConnector.prototype.sendResponse = function(deviceUri, serviceUri, correlationId, payload){
    var msgSegments = payload ? {metrics: payload} : {};
    this.send("response/"+deviceUri+"/"+serviceUri, JSON.stringify({payload: msgSegments, correlation_id: correlationId}));
};

SenergyConnector.prototype.send = function(topic, msg){
    console.log("SENERGY: send ", topic, msg);
    if(this.config.protocol == "ws:" || this.config.protocol == "wss:"){
        return this.sendWs(topic, msg);
    }else if(this.config.protocol == "tcp:") {
        return this.sendTcp(topic, msg);
    }else{
        console.log("ERROR: unknown protocol", this.config.protocol);
    }
};

SenergyConnector.prototype.watchMetrics = function(){
    var self = this;
    this.handleZwayEvent = this.getZwayEventHandler();
    this.controller.devices.map(function (vDev) {
        vDev.on("change:metrics:level", self.handleZwayEvent);
    });
};

SenergyConnector.prototype.unwatchMetrics = function(){
    var self = this;
    this.controller.devices.map(function (vDev) {
        if(self.handleZwayEvent){
            vDev.off("change:metrics:level", self.handleZwayEvent);
        }
    });
};

SenergyConnector.prototype.getZwayEventHandler = function(){
    var that = this;
    return function (vDev) {
        try{
            var deviceUri = getGloablDeviceUri(vDev);
            var payload = JSON.stringify(getMetrics(vDev));
            that.sendEvent(deviceUri, "sepl_get", payload);

            var level = JSON.stringify(getMetricsLevel(vDev));
            that.sendEvent(deviceUri, "sepl_get_level", level);
        }catch (e) {
            console.log("ERROR: start::provisioning ", e, e.message);
        }

    }
};

//ws

SenergyConnector.prototype.updateConnectionWs = function (devices) {
    console.log("Update Senergy-MQTT-Connection ws", this.config.mqtt_url);

    if(this.mqtt && this.mqtt.disconnect && this.mqtt.client.connected){
        try{
            this.mqtt.disconnect();
        }catch (e) {
            console.log("ERROR: while disconnecting", e)
        }
    }
    this.mqtt = null;

    const url = parseUrl(this.config.mqtt_url);

    var host = url.hostname;
    var port = url.port;
    var clientId = hubIdProvider.get();
    var username = this.config.user;
    var password = this.config.password;
    var keepAlive = 20;
    var cleanSession = true;
    var ssl = url.protocol == "wss:";
    var that = this;

    this.mqtt = new Messaging.Client(host, port, clientId);

    this.mqtt.onConnectionLost = function () {
        console.log("MQTT: lost connection; reset local hash");
        that.reg.resetHash();
    };

    this.mqtt.onMessageArrived = function (message) {
        that.handleWsCommandMessage(message);
    };

    var options = {
        timeout: 3,
        keepAliveInterval: keepAlive,
        cleanSession: cleanSession,
        useSSL: ssl,
        userName: username,
        password: password,
        onSuccess: function () {
            console.log("DEBUG: connected");
            if(devices){
                devices.forEach(function (device) {
                    if(device.uri){
                        try{
                            that.mqtt.subscribe("command/"+device.uri+"/+",  {qos: 2});
                        }catch (e) {
                            that.reg.resetHash();
                            console.log("ERROR: unable to subscribe", e, e.message, JSON.stringify(e));
                        }
                    }else{
                        console.log("WARNING: missing uri in device; ignore", JSON.stringify(device));
                    }
                })
            }
        },
        onFailure: function (err) {
            console.log("DEBUG: onFailure:", JSON.stringify(err));
            that.reg.resetHash();
        }
    };

    this.mqtt.connect(options);
};

SenergyConnector.prototype.handleWsCommandMessage = function(message){
    //console.log("handleWsCommandMessage:" + message.payloadString + " qos: " + message.qos, message.destinationName);
    try{
        var msg = JSON.parse(message.payloadString);
        var correlationId = msg.correlation_id;
        var payload = msg.payload.metrics;
        var topic = message.destinationName;
        var topicParts = topic.split("/");
        var globalDeviceUri = topicParts[1];
        var serviceUri = topicParts[2];
        var localDeviceUri = getLocalDeviceUri(globalDeviceUri);
        var metrics = payload && JSON.parse(payload);
        var result = this.sendCommandToZway(localDeviceUri, serviceUri, metrics);
        this.sendResponse(globalDeviceUri, serviceUri, correlationId, result);
    }catch (e) {
        console.log("ERROR: unable to handle ws command message", e, e.message, JSON.stringify(e))
    }
};

SenergyConnector.prototype.sendWs = function(topic, msg){
    if(this.mqtt && this.mqtt.send && this.mqtt.client.connected){
        try{
            var message = new Messaging.Message(msg);
            message.destinationName = topic;
            message.qos = 0;
            message.retained = false;
            this.mqtt.send(message);
        }catch (e) {
            console.log("ERROR: unable to send ws message", e, e.message, JSON.stringify(e), topic, msg);
            this.reg.resetHash();
        }
    }else{
        console.log("WARNING: mqtt not connected; unable to send ws message for", topic, msg)
    }
};


// tcp

SenergyConnector.prototype.updateConnectionTcp = function (devices) {
    console.log("Update Senergy-MQTT-Connection tcp", this.config.mqtt_url);

    if(this.mqtt && this.mqtt.close && this.mqtt.connected){
        try{
            that.mqtt.onDisconnect(function () {console.log("DEBUG: close inception")});
            this.mqtt.close();
        }catch (e) {
            console.log("ERROR: while disconnecting", e)
        }
    }
    this.mqtt = null;


    var that = this;

    const url = parseUrl(this.config.mqtt_url);

    var host = url.hostname;
    var port = url.port;
    var clientId = hubIdProvider.get();
    var username = this.config.user;
    var password = this.config.password;
    var keepAlive = 20;
    var cleanSession = true;

    var mqttOptions = {
        client_id: clientId,
        will_flag: false,
        username: username,
        password: password,
        ping_interval: keepAlive*1000,
        ping_timeout: 60,
        connect_timeout: 60,
        clean_session: cleanSession,
        infoLogEnabled: false,
        onMessageArrived: function (topic, message) {
            console.log("DEBUG: receive command", topic, message);
            that.handleTcpCommandMessage(topic, message);
        }
    };

    that.mqtt = new MQTTClient(host, port, mqttOptions);
    that.mqtt.onLog(function (msg) { console.log("DEBUG: ", msg.toString()); });
    that.mqtt.onError(function (error) { console.log("ERROR: ", error.toString()); });
    that.mqtt.onDisconnect(function () { that.reg.resetHash(); console.log("DEBUG: connection lost") });
    that.mqtt.onConnect(function () {
        console.log("DEBUG: connected");
        if(devices){
            devices.forEach(function (device) {
                if(device.uri){
                    try{
                        that.mqtt.subscribe("command/"+device.uri+"/+",  {qos: 2});
                    }catch (e) {
                        that.reg.resetHash();
                        console.log("ERROR: unable to subscribe", e, e.message, JSON.stringify(e));
                    }
                }else{
                    console.log("WARNING: missing uri in device; ignore", JSON.stringify(device));
                }
            })
        }
    });
    that.mqtt.connect();
};

SenergyConnector.prototype.handleTcpCommandMessage = function(topic, message){
    try{
        var msg = JSON.parse(message);
        var correlationId = msg.correlation_id;
        var payload = msg.payload.metrics;
        var topic = topic;
        var topicParts = topic.split("/");
        var globalDeviceUri = topicParts[1];
        var serviceUri = topicParts[2];
        var localDeviceUri = getLocalDeviceUri(globalDeviceUri);
        var metrics = payload && JSON.parse(payload);
        var result = this.sendCommandToZway(localDeviceUri, serviceUri, metrics);
        this.sendResponse(globalDeviceUri, serviceUri, correlationId, result);
    }catch (e) {
        console.log("ERROR: unable to handle tcp command message", e, e.message, JSON.stringify(e))
    }
};

SenergyConnector.prototype.sendTcp = function(topic, msg){
    if(this.mqtt && this.mqtt.publish && this.mqtt.connected){
        try{
            this.mqtt.publish(topic, msg.trim(), {qos_level: 0, retain: false});
        }catch (e) {
            console.log("ERROR: unable to send tcp message", e, e.message, JSON.stringify(e), topic, msg);
            this.reg.resetHash();
        }
    }else{
        console.log("WARNING: mqtt not connected; unable to send tcp message for", topic, msg)
    }
};


// helper

function getMetrics(device){
    var metrics = JSON.parse(JSON.stringify(device.get("metrics")));
    metrics.updateTime = device.get("updateTime");
    if(metrics.icon){
        delete metrics.icon;
    }
    return metrics;
}

function getMetricsLevel(device){
    return {level: device.get("metrics").level, updateTime: new Date(device.get("updateTime")*1000).toISOString()};
}

function parseUrl(mqtt_url) {
    var result = {};
    var parts = mqtt_url.split("//");
    if(parts.length<2){
        return false
    }
    result.protocol = parts[0];
    parts = parts[1].split(":");
    if(parts.length<2){
        return false
    }
    result.hostname = parts[0];
    parts = parts[1].split("/");
    result.port = parseInt(parts[0]);
    return result
}
