/** Constructor method:
 this Line is a call of the superconstruktor
 has always to be first line of the constructor:**/
function SeplConnector (id, controller) {
    SeplConnector.super_.call(this, id, controller);
}
// Inheration call:
inherits(SeplConnector, AutomationModule);
//definition of the class reference:
_module = SeplConnector;
/** Initialization method:
 Variable for referenciate to the class in own methods,
 because this is context dependent in JavaScript
 Here you can register listeners see EventBus **/
SeplConnector.prototype.init = function (config) {
    SeplConnector.super_.prototype.init.call(this, config);
    this.controller.on(function(){
        console.log("any event", JSON.stringify(arguments));
    });
    this.initCom(config);
    this.updateDeviceReg();
};
/** Destroy method:
 Here you have to unregister Listeners see EventBus **/
SeplConnector.prototype.stop = function () {
    SeplConnector.super_.prototype.stop.call(this);
};

SeplConnector.prototype.initCom = function(config){
    console.log(JSON.stringify( sockets ));

    for(var index in sockets) {
        console.log(index);
    }
    var connection = new sockets.websocket('wss://echo.websocket.org');
    connection.onopen = function () {
        connection.send(config.user+":"+config.password);
    };

// Log errors
    connection.onerror = function (error) {
        console.log('WebSocket Error ' + error);
    };

// Log messages from the server
    connection.onmessage = function (e) {
        console.log('Server: ' + e.data);
    };
    /*
    console.log("init com to sepl", JSON.stringify(config));
    var device = this.controller.devices.get("DummyDevice_9");
    device.performCommand("exact", {level: "32"});
    console.log(JSON.stringify(device));
    device.performCommand("on");
    console.log(JSON.stringify(device));
    */
};

SeplConnector.prototype.updateDeviceReg = function(){
    var self = this;
};

