
function SenergyConnector (id, controller) {
    SenergyConnector.super_.call(this, id, controller);
}

inherits(SenergyConnector, AutomationModule);
_module = SenergyConnector;


const SenergyClientId = "client-connector-lib";

SenergyConnector.prototype.init = function (config) {
    console.log("Start SenergyConnector with delay: ", config.startupdelay, "s");
    SenergyConnector.super_.prototype.init.call(this, config);
    this.config = config;

    executeFile("userModules/SenergyConnector/mqtt/mqttws31.js");
    executeFile("userModules/SenergyConnector/provisioning.js");
    executeFile("userModules/SenergyConnector/zwayhelper.js");
    executeFile("userModules/SenergyConnector/connector.js");

    this.start()
};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    this.unwatchMetrics();
    SenergyConnector.super_.prototype.stop.call(this);
};


SenergyConnector.prototype.start = function () {
    console.log("Start SenergyConnector");
    this.provisioning();
    var that = this;
    setInterval(function(){that.provisioning()}, 15000)
    this.watchMetrics();
};

SenergyConnector.prototype.provisioning = function () {
    try{
        var config = this.config;
        var devices = getZwayDevices(this.controller);
        var hash = devicesHash(devices);
        var that = this;
        console.log("DEBUG: local provision check", JSON.stringify(this.hash), JSON.stringify(hash));
        if(this.hash != hash){
            console.log("DEBUG: update provisioning");
            var result = login(config.auth_url, SenergyClientId, config.user, config.password);
            if(result.err){
                console.log("login error:", JSON.stringify(result.err));
                return
            }
            var token = result.token;
            provisionHub(config.iot_repo_url, token, "", devices, hubIdProvider, function(result){
                if(result.err){
                    console.log("ERROR: provisioning error:", JSON.stringify(result.err));
                    return
                }
                that.hash = hash;
                that.updateConnection(devices)
            });
        }
    }
    catch (e) {
        console.log("ERROR: catch:", e, e.stack)
    }
};


SenergyConnector.prototype.updateConnection = function (devices) {
    console.log("Update Senergy-MQTT-Connection", this.config.mqtt_url);

    if(this.mqtt){
        this.mqtt.onConnectionLost = nullFunc;
        this.mqtt.onMessageArrived = nullFunc;
    }
    if(this.mqtt && this.mqtt.disconnect){
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
        that.hash = null;
        that.mqtt.onConnectionLost = nullFunc;
        that.mqtt.onMessageArrived = nullFunc;
        that.mqtt = null;
    };

    this.mqtt.onMessageArrived = function (message) {
        that.handleCommandMessage(message);
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
            that.hash = null;
            that.mqtt.onConnectionLost = nullFunc;
            that.mqtt.onMessageArrived = nullFunc;
            that.mqtt = null;
        }
    };

    this.mqtt.connect(options);
};

SenergyConnector.prototype.handleCommandMessage = function(message){
    console.log("handleCommandMessage:" + message.payloadString + " qos: " + message.qos, message.destinationName);
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
        console.log("ERROR: unable to handle comamnd message", e, e.message, JSON.stringify(e))
    }
};

SenergyConnector.prototype.sendCommandToZway = function(id, command, metrics){
    var device = this.controller.devices.get(id);
    if(device){
        if(command == "sepl_get"){
            var metrics = getMetrics(device);
            return JSON.stringify(metrics)
        }else{
            device.performCommand(command, metrics);
        }
    }
    return null;
};

SenergyConnector.prototype.sendEvent = function(deviceUri, serviceUri, payload){
    if(this.mqtt && this.mqtt.send){
        try{
            var message = new Messaging.Message({metrics: payload});
            message.destinationName = "event/"+deviceUri+"/"+serviceUri;
            message.qos = 2;
            message.retained = false;
            this.client.send(message);
        }catch (e) {
            console.log("ERROR: unable to send event message", e, e.message, JSON.stringify(e))
        }
    }else{
        console.log("WARNING: mqtt not connected; unable to send event message for", deviceUri, serviceUri)
    }
};

SenergyConnector.prototype.sendResponse = function(deviceUri, serviceUri, correlationId, payload){
    if(this.mqtt && this.mqtt.send){
        try{
            var msgSegments = payload ? {metrics: payload} : {};
            var message = new Messaging.Message(JSON.stringify({payload: msgSegments, correlation_id: correlationId}));
            message.destinationName = "response/"+deviceUri+"/"+serviceUri;
            message.qos = 2;
            message.retained = false;
            this.client.send(message);
        }catch (e) {
            console.log("ERROR: unable to send event message", e, e.message, JSON.stringify(e))
        }
    }else{
        console.log("WARNING: mqtt not connected; unable to send event message for", deviceUri, serviceUri)
    }
};

SenergyConnector.prototype.watchMetrics = function(){
    var self = this;
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

SenergyConnector.prototype.handleZwayEvent = function (vDev) {
    var deviceUri = getGloablDeviceUri(vDev);
    var serviceUri = "sepl_get";
    var payload = JSON.stringify(getMetrics(vDev));
    this.sendEvent(deviceUri, serviceUri, payload)
};

function getMetrics(device){
    var metrics = JSON.parse(JSON.stringify(device.get("metrics")));
    metrics.updateTime = device.get("updateTime");
    if(metrics.icon){
        delete metrics.icon;
    }
    return metrics;
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

function nullFunc() {}
