
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

    //TODO: remove comment
    //self.start()
    var that = this;
    setTimeout(function () {
        that.updateConnection();//TODO remove
    }, 2000)
};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    SenergyConnector.super_.prototype.stop.call(this);
};


SenergyConnector.prototype.start = function () {
    console.log("Start SenergyConnector");
    this.provisioning();
    var that = this;
    setInterval(function(){that.provisioning()}, 15000)
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


SenergyConnector.prototype.updateConnection = function () {
    console.log("Update Senergy-MQTT-Connection", this.config.mqtt_url);
    //var client = global.mqtt.connect(this.config.mqtt_url, {clientId: hubIdProvider.get(), username:this.config.user, password:this.config.password});
    //var client = global.mqtt.connect(this.config.mqtt_url, {clientId: hubIdProvider.get()});

    const url = parseUrl(this.config.mqtt_url);

    var host = url.hostname;
    var port = url.port;
    var clientId = hubIdProvider.get() || "test";
    var username = this.config.user;
    var password = this.config.password;
    var keepAlive = 60;
    var cleanSession = true;
    var ssl = url.protocol == "wss:";

    var client = new Messaging.Client(host, port, clientId);
    client.onConnectionLost = function () {
        console.log("DEBUG: disconnected")
    };
    client.onMessageArrived = onMessageArrived = function (message) {
        console.log("onMessageArrived:" + message.payloadString + " qos: " + message.qos);
    };

    var options = {
        timeout: 3,
        keepAliveInterval: keepAlive,
        cleanSession: cleanSession,
        useSSL: ssl,
        userName: username,
        password: password,
        onSuccess: function () {
            console.log("DEBUG: connected")
            client.subscribe("test/topic/foo",  {qos: 0});

            setTimeout(function () {
                var message = new Messaging.Message("test foo bar 123");
                message.destinationName = "test/topic/foo";
                message.qos = 0;
                client.send(message);
            }, 1000)
        },
        onFailure: function (err) {
            console.log("DEBUG: error:", err, JSON.stringify(err))
        }
    };

    client.connect(options);
};

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
