Modules.include("physical-devices");
Modules.include("mqtt");
var PhysicalDevices = Modules.get("physical-devices");
var Mqtt = Modules.get("mqtt");

function SenergyConnector (id, controller) {
    SenergyConnector.super_.call(this, id, controller);
}

inherits(SenergyConnector, AutomationModule);
_module = SenergyConnector;

SenergyConnector.prototype.init = function (config) {
    var that = this;
    console.log("Init SenergyConnector");
    SenergyConnector.super_.prototype.init.call(this, config);

    this.mqttConnection = Mqtt.connect(
        config.mqtt_url,
        "test-client",
        config.user,
        config.password,
        true,
        function (connection, err) {
            console.log("DISCONNECT: ", JSON.stringify(err))
        }, function (connection) {
            console.log("CONNECT");
            var subscribeResult = that.mqttConnection.subscribe("test/topic", 2);
            console.log("Subscribtion: ", JSON.stringify(subscribeResult));
        }, function (connection, err) {
            console.log("CONNECTION-ERROR: ", JSON.stringify(err))
        }, function(connection, topic, payload){
            console.log("MESSAGE: ", topic, payload)
        }
    );

    if(this.mqttConnection.err){
        console.log("ERROR: unable to connect: ", this.mqttConnection.err);
        return
    }


    this.interval = setInterval(function(){
        that.mqttConnection.send("test/topic", "test-message");
        console.log(JSON.stringify(PhysicalDevices.getDevices(that.controller)));
    }, 15000);

};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    SenergyConnector.super_.prototype.stop.call(this);

    if(this.interval){
        clearInterval(this.interval);
    }

    this.mqttConnection.disconnect();
};
