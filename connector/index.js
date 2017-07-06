
function SeplConnector (id, controller) {
    SeplConnector.super_.call(this, id, controller);
}

inherits(SeplConnector, AutomationModule);
_module = SeplConnector;


SeplConnector.prototype.init = function (config) {
    console.log("Start SeplConnector");
    SeplConnector.UriPrefix = config.controller_id;

    var self = this;
    SeplConnector.super_.prototype.init.call(this, config);
    this.client = SeplConnectorClient(config.sepl_url, config.user, config.password);

    this.client.start(function(){
        self.onMetricsChange = function (vDev){
            var metrics = JSON.stringify(self.getMetrics(vDev));
            console.log("metric change: ", getGloablDeviceUri(vDev), metrics);
            this.client.sendEvent(getGloablDeviceUri(vDev), "sepl_get", metrics, 10);
        };
        self.handleDevices();
        self.watchMetrics();
        self.handleCommands();
    });

};


SeplConnector.prototype.stop = function () {
    console.log("Start SeplConnector");
    this.unwatchMetrics();
    this.client.stop();
    SeplConnector.super_.prototype.stop.call(this);
};

SeplConnector.prototype.handleDevices = function(){
    var self = this;
    this.controller.on(function (name,eventarray){
        self.deviceEventHandler();
    });
    this.registerDevices();
};

SeplConnector.prototype.watchMetrics = function(){
    var self = this;
    this.controller.devices.map(function (vDev) {
        console.log("sepl watch: ", JSON.stringify(vDev));
        vDev.on("change:metrics:level", self.onMetricsChange);
    });
};

SeplConnector.prototype.unwatchMetrics = function(){
    var self = this;
    this.controller.devices.map(function (vDev) {
        console.log("sepl unwatch: ", JSON.stringify(vDev));
        vDev.off("change:metrics:level", self.onMetricsChange);
    });
};

SeplConnector.prototype.getMetrics = function(device){
    var metrics = JSON.parse(JSON.stringify(device.get("metrics")));    //copy metrics
    metrics.updateTime = device.get("updateTime");
    if(metrics.icon){
        delete metrics.icon;
    }
    return metrics;
};

SeplConnector.prototype.deviceEventHandler = function(){
    var self = this;
    if(!self.knownDevices){
        self.knownDevices = [];
    }
    if(self.knownDevices.length < self.controller.devices.length){
        self.controller.devices.map(function (vDev) {
            var id = vDev.id;
            if(self.knownDevices.indexOf(id) < 0){
                self.knownDevices.push(id);
                self.bufferedDeviceRegister(self.knownDevices.length);
            }
        });
    }
};

SeplConnector.prototype.bufferedDeviceRegister = function(offset){
    var timeout = 1000; //1s
    var self = this;
    console.log("sepl: call to bufferedDeviceRegister(", offset, ")");
    setTimeout(function(){
        console.log("sepl: check for registering new devices: ", offset);
        if(self.knownDevices.length == offset){
            console.log("sepl: register devices: ", self.knownDevices.length);
            self.unwatchMetrics();
            self.watchMetrics();
            self.registerDevices();
        }else{
            console.log("sepl: registering wait: ", offset, "!=",  self.knownDevices.length)
        }
    }, timeout)
};


SeplConnector.prototype.registerDevices = function(){
    var self = this;
    //listen to device commands
    this.client.addDevices(this.controller.devices.map(function (x) {
        return {"uri": getGloablDeviceUri(x),  "connector_type": x.get("deviceType"), "name": x.get("metrics").title};
    }));

    //update potential name changes
    this.controller.devices.map(function (x) {
        self.client.updateDeviceName(getGloablDeviceUri(x), x.get("metrics").title);
    });
};

SeplConnector.prototype.handleCommands = function(){
    var self = this;
    this.client.onCommand(function(msg){
        var command = msg.service_url;
        var id = msg.device_url;

        var metrics = msg.protocol_parts && msg.protocol_parts.length == 1 && msg.protocol_parts[0] && msg.protocol_parts[0].name == "metrics" && JSON.parse(msg.protocol_parts[0].value);

        msg.protocol_parts = self.sendCommandToZway(id, command, metrics);
        self.client.sendResponse(msg);
    });
};

SeplConnector.prototype.sendCommandToZway = function(id, command, metrics){
    var device = this.controller.devices.get(getLocalDeviceUri(id));
    if(device){
        if(command == "sepl_get"){
            var metrics = this.getMetrics(device);
            return [{
                name: "metrics",
                value: JSON.stringify(metrics)
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


function getGloablDeviceUri(device){
    if(SeplConnector.UriPrefix){
        return "ZWAY_"+SeplConnector.UriPrefix+"_"+device.id;
    }
    return "ZWAY_"+device.id;
}

function getLocalDeviceUri(globalUri){
    if(SeplConnector.UriPrefix){
        return globalUri.replace("ZWAY_"+SeplConnector.UriPrefix+"_", "");
    }
    return globalUri.replace("ZWAY_", "");
}