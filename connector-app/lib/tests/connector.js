Tests["connector"]=function (ctx) {
    return SKIP;

    var Connector = Modules.include("connector");

    //url, hubId, user, password, then, error
    Connector.connect(
        ctx.config.mqtt_url,
        "test-client",
        ctx.config.user,
        ctx.config.password,
        function (connection) {
            console.log("TEST-CONNECT");
            var err = connection.registerCommand("device", "service", function (device, service, message) {
                console.log("TEST-HANDLE-COMMAND", message, JSON.stringify(message));
                //echo
                return message
            });
            console.log("TEST-REGISTER-COMMAND:", JSON.stringify(err));
            setInterval(function(){
                connection.sendEvent("device", "service", JSON.stringify({"body":"eventFooBar"}), false);
                connection._connection.send("command/device/service", JSON.stringify({"correlation_id":42,"payload":{"body":"foobar"},"timestamp":0,"completion_strategy":"none"}));
            }, 15000);
        }, function (connection, err) {
            console.log("ERROR: ", JSON.stringify(err))
        }
    );
    return null;
};
