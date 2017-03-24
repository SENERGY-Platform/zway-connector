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
    //TODO remove user given topics
    connection.send(JSON.stringify({user: config.user, pw: config.password}));
};

SeplConnector.prototype.initCom = function(config){
    var self = this;

    var connectorUrl = self.lookupConnector(config);

    console.log(self.discovery(connectorUrl, config));

    var connection = new sockets.websocket(connectorUrl);
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

    connection.onerror = function (error) {
        setTimeout(function () {
            self.initCom(config);
        },10000);
        console.log('WebSocket Error');
    };

    connection.onmessage = function (e) {
        var msg = JSON.parse(e.data);
        var command = msg.service_url;
        var id = msg.device_url;

        var metrics = msg.protocol_parts && msg.protocol_parts.length == 1 && msg.protocol_parts[0] && msg.protocol_parts[0].name == "metrics" && JSON.parse(msg.protocol_parts[0].value);

        msg.protocol_parts = self.sendCommandToZway(id, command, metrics);
        connection.send(JSON.stringify(msg));
    };
};

SeplConnector.prototype.lookupConnector = function(config){
    var resp = http.request({
        url: "http://"+config.sepl_url+"/lookup"
    });
    return resp.data;
};

SeplConnector.prototype.discovery = function(url, config){
    var resp = http.request({
        url: "http://"+config.sepl_url+"/discovery",
        method: "POST",
        data: JSON.stringify({
            "credentials": {
                "user": config.user,
                "pw": config.password
            },
            "devices": this.controller.devices.map(function (x) {
                return {"id": x.id,  "zway_type": x.get("deviceType"), "title": x.get("metrics").title};
            })
        })
    });
    return resp.data;
};

SeplConnector.prototype.sendCommandToZway = function(id, command, metrics){
    var device = this.controller.devices.get(id);
    if(device){
        if(command == "sepl_get"){
            var metricsWithUpdateTime = JSON.parse(JSON.stringify(device.get("metrics")));
            metricsWithUpdateTime.updateTime = device.get("updateTime");
            if(metricsWithUpdateTime.icon){
                delete metricsWithUpdateTime.icon;
            }
            return [{
                name: "metrics",
                value: JSON.stringify(metricsWithUpdateTime)
            }];
        }else{
            if (metrics){
                device.performCommand(command);
            }else{
                device.performCommand(command, metrics);
            }
        }
    }
    return null;
};
