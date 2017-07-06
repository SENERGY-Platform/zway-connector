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
    console.log("Start SeplConnector");
    SeplConnector.super_.prototype.init.call(this, config);

    //onMetricsChange cant be defined as prototype method
    var self = this;
    this.onMetricsChange = function (vDev){
        var metrics = JSON.stringify(self.getMetrics(vDev));
        console.log("metric change: ", vDev.id, metrics);
        self.changedMetrics.push({metrics: metrics, device: vDev.id});
        self.flushChangedMetrics();
    };

    this.watchMetrics();
    this.initCom(config);

    this.controller.on(function (name,eventarray){
        self.eventHandler();
    } );
};

/** Destroy method:
 Here you have to unregister Listeners see EventBus **/
SeplConnector.prototype.stop = function () {
    console.log("Stop SeplConnector");
    this.unwatchMetrics();
    if (this.connection) {
        this.stopWS = true;
        this.connection.close();
    }
    SeplConnector.super_.prototype.stop.call(this);
};

SeplConnector.prototype.changedMetrics = [];


SeplConnector.prototype.unwatchMetrics = function(){
    var self = this;
    this.controller.devices.map(function (vDev) {
        console.log("sepl unwatch: ", JSON.stringify(vDev));
        vDev.off("change:metrics:level", self.onMetricsChange);
    });
};

SeplConnector.prototype.watchMetrics = function(){
    var self = this;
    this.controller.devices.map(function (vDev) {
        console.log("sepl watch: ", JSON.stringify(vDev));
        vDev.on("change:metrics:level", self.onMetricsChange);
    });
};

SeplConnector.prototype.flushChangedMetrics = function(){
    while(this.changedMetrics.length){
        if(!this.connection){
            return;
        }
        this.sendMetricChange(this.changedMetrics.shift());
    }
};

SeplConnector.prototype.sendMetricChange = function(change){
    try{
        this.connection.send("change:"+JSON.stringify(change));
    }catch(e){
        console.log("error on change sending: ", e);
    }
};

var sendCredentials = function(connection, config){
    //TODO remove user given topics
    console.log("SeplConnector send credentials");
    connection.send(JSON.stringify({user: config.user, pw: config.password}));
};


SeplConnector.prototype.initCom = function(config){
    console.log("SeplConnector initCom");
    var self = this;

    if(!self.reInit){
        self.reInit = function(config){
            if(self.connection && self.connection.stop){
                self.connection.stop();
                self.connection = null;
            }
            console.log("set reinit timeout: ", 10000);
            setTimeout(function () {
                console.log("SeplConnector try reinit if not stop:", self.stopWS);
                if (!self.stopWS) {
                    self.initCom(config);
                }
            },10000);
        };
    }

    try{
        var connectorUrl = self.lookupConnector(config);

        self.registerDevices = function(){
            return self.discovery(connectorUrl, config)
        };

        console.log(self.registerDevices());
        console.log("connect to :"+connectorUrl);

        var connection = new sockets.websocket(connectorUrl);
        this.connection = connection;
        connection.onopen = function () {
            console.log('WebSocket Open');
            sendCredentials(connection, config);
            self.flushChangedMetrics();
        };

        connection.onclose = function(){
            console.log('WebSocket Closed');
            self.reInit(config);
        };

        connection.onerror = function (error) {
            console.log('WebSocket Error', error);
            self.reInit(config);
        };

        connection.onmessage = function (e) {
            var msg = JSON.parse(e.data);
            var command = msg.service_url;
            var id = msg.device_url;

            var metrics = msg.protocol_parts && msg.protocol_parts.length == 1 && msg.protocol_parts[0] && msg.protocol_parts[0].name == "metrics" && JSON.parse(msg.protocol_parts[0].value);

            msg.protocol_parts = self.sendCommandToZway(id, command, metrics);
            connection.send("response:"+JSON.stringify(msg));
        };
    }catch (e){
        console.log("sepl connector init error:", e);
        self.reInit(config);
    }
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

SeplConnector.prototype.getMetrics = function(device){
    var metrics = JSON.parse(JSON.stringify(device.get("metrics")));
    metrics.updateTime = device.get("updateTime");
    if(metrics.icon){
        delete metrics.icon;
    }
    return metrics;
};

SeplConnector.prototype.sendCommandToZway = function(id, command, metrics){
    var device = this.controller.devices.get(id);
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

SeplConnector.prototype.eventHandler = function(){
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
            self.connection.send("update");
        }else{
            console.log("sepl: registering wait: ", offset, "!=",  self.knownDevices.length)
        }
    }, timeout)
};