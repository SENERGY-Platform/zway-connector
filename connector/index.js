executeFile("userModules/SeplConnector/protocol.js");
executeFile("userModules/SeplConnector/connector.js");


function SeplConnector (id, controller) {
    SeplConnector.super_.call(this, id, controller);
}

inherits(SeplConnector, AutomationModule);
_module = SeplConnector;


SeplConnector.prototype.init = function (config) {
    console.log("Start SeplConnector");
    SeplConnector.super_.prototype.init.call(this, config);

    var self = this;
    self.UriPrefix = config.controller_id;

    //TODO: configuratable zway name (zway == Z-Wave Network Access.config.name (internalName))
    this.zwayModuleName = "zway";

    this.client = SeplConnectorClient(config.sepl_url, config.user, config.password);

    this.client.start(function(){
        self.onMetricsChange = function (vDev){
            var metrics = JSON.stringify(self.getMetrics(vDev));
            console.log("metric change: ", self.getGloablDeviceUri(vDev), metrics);
            var msg = [{
                name: "metrics",
                value: metrics
            }];
            self.client.sendEvent(self.getGloablDeviceUri(vDev), "sepl_get", msg, 10);
        };
        self.handleDevices();
        self.watchMetrics();
        self.handleCommands();
    });

};

SeplConnector.prototype.getTags = function(){
    var self = this;
    var result = {};

    var pysicalDevices = {};
    if(global.ZWave && global.ZWave[this.zwayModuleName]){
        pysicalDevices = JSON.parse(global.ZWave[this.zwayModuleName].Data("").body).devices;
    }

    var parsePId = function(vId){
        //ZWayVDev_zway_12-0-113-7-8-A
        //ZWayVDev_[Node ID]:[Instance ID]:[Command Class ID]:[Scale ID]
        var parts = vId.split("_");
        var pId = parts[parts.length-1].split("-")[0];
        return pId
    };

    self.controller.devices.map(function (vDev) {
        var pId = parsePId(vDev.id);
        var pDev = pysicalDevices[pId];
        var groupName = "";
        if(pDev){
            groupName = pDev.data.givenName.value;
        }
        if(groupName != ""){
            result[vDev.id] = [DEVICE_GROUP_TAG_KEY+":"+groupName];
        }else{
            result[vDev.id] = [];
            //result[vDev.id] = ["test_tag:test"];
        }
    });
    return result
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

    var tags = self.getTags();

    //listen to device commands
    this.client.addDevices(this.controller.devices.map(function (x) {
        return {"uri": self.getGloablDeviceUri(x),  "connector_type": x.get("deviceType"), "name": x.get("metrics").title, "tags":tags[x.id]};
    }));
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
    var self = this;
    var device = this.controller.devices.get(self.getLocalDeviceUri(id));
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


SeplConnector.prototype.getGloablDeviceUri = function(device){
    if(this.UriPrefix){
        return "ZWAY_"+this.UriPrefix+"_"+device.id;
    }
    return "ZWAY_"+device.id;
};

SeplConnector.prototype.getLocalDeviceUri = function(globalUri){
    if(this.UriPrefix){
        return globalUri.replace("ZWAY_"+this.UriPrefix+"_", "");
    }
    return globalUri.replace("ZWAY_", "");
};