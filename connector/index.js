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
    this.initCom(config);
};
/** Destroy method:
 Here you have to unregister Listeners see EventBus **/
SeplConnector.prototype.stop = function () {
    SeplConnector.super_.prototype.stop.call(this);
};

var sendCredentials = function(connection, config){
    connection.send(JSON.stringify({user: config.user, pw: config.password}));
};

SeplConnector.prototype.initCom = function(config){
    var self = this;
    var connection = new sockets.websocket(config.sepl_url);
    connection.onopen = function () {
        console.log('WebSocket Open');
        sendCredentials(connection, config);
    };

    connection.onclose = function(){
        setTimeout(function () {
            self.initCom(config);
        },10000);
        console.log('WebSocket Closed');
    };

// Log errors
    connection.onerror = function (error) {
        console.log('WebSocket Error ' + error);
    };

// Log messages from the server
    connection.onmessage = function (e) {
        console.log('Server: ', e.data);
        console.log(typeof e.data);
        var msg = JSON.parse(e.data);

        var command = msg.service_url;
        var id = msg.device_url;

        var metrics = null;
        console.log(msg.protocol_parts); //TODO

        msg.protocol_parts = self.sendCommandToZway(id, command, metrics);
        connection.send(JSON.stringify(msg));
    };
};


SeplConnector.prototype.sendCommandToZway = function(id, command, metrics){
    var device = this.controller.devices.get(id);
    if (metrics != null){
        device.performCommand(command);
    }else{
        device.performCommand(command, metrics);
    }
    console.log(JSON.stringify(device));
    if(command == "update"){
        //TODO
        return [];
    }else{
        return null;
    }
};
