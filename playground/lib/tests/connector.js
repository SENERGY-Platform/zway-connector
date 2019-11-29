Tests["connector"]=function (ctx) {
    //skip
    return SKIP;

    var Connector = Modules.include("connector");

    //url, hubId, user, password, then, error
    var mqttConnection = Connector.connect(
        ctx.config.mqtt_url,
        "test-client",
        ctx.config.user,
        ctx.config.password,
        function (connection) {
            console.log("CONNECT");
            var err = mqttConnection.registerCommand("device", "service", function (device, service, message) {
                //echo
                return message
            });
            that.interval = setInterval(function(){
                mqttConnection.sendEvent("device", "service", JSON.stringify({"body":"eventFooBar"}));
                mqttConnection._connection.send("command/device/service", JSON.stringify({"correlation_id":42,"payload":{"body":"foobar"},"timestamp":0,"completion_strategy":"none"}));
            }, 15000);
        }, function (connection, err) {
            console.log("ERROR: ", JSON.stringify(err))
        }
    );

    if(this.mqttConnection.err){
        console.log("ERROR: unable to connect: ", this.mqttConnection.err);
        return this.mqttConnection.err
    }
    return null;
};
