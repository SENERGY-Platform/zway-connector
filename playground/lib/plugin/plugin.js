Modules.include("physical-devices");
Modules.include("connector");
var PhysicalDevices = Modules.get("physical-devices");
var Connector = Modules.get("connector");

function SenergyConnector (id, controller) {
    SenergyConnector.super_.call(this, id, controller);
}

inherits(SenergyConnector, AutomationModule);
_module = SenergyConnector;

SenergyConnector.prototype.init = function (config) {
    var that = this;
    console.log("Init SenergyConnector");
    SenergyConnector.super_.prototype.init.call(this, config);

    //url, hubId, user, password, then, error
    this.mqttConnection = Connector.connect(
        config.mqtt_url,
        "test-client",
        config.user,
        config.password,
        function (connection) {
            console.log("CONNECT");
            var err = that.mqttConnection.registerCommand("device", "service", function (device, service, message) {
                //echo
                return message
            });

            that.interval = setInterval(function(){
                that.mqttConnection.sendEvent("device", "service", JSON.stringify({"body":"eventFooBar"}));
                that.mqttConnection._connection.send("command/device/service", JSON.stringify({"correlation_id":42,"payload":{"body":"foobar"},"timestamp":0,"completion_strategy":"none"}));
            }, 15000);
        }, function (connection, err) {
            console.log("ERROR: ", JSON.stringify(err))
        }
    );

    if(this.mqttConnection.err){
        console.log("ERROR: unable to connect: ", this.mqttConnection.err);
        return
    }

};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    SenergyConnector.super_.prototype.stop.call(this);

    if(this.interval){
        clearInterval(this.interval);
    }

    this.mqttConnection.disconnect();
};
