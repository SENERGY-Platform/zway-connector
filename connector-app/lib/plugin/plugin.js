const DEV = false;

function SenergyConnector (id, controller) {
    SenergyConnector.super_.call(this, id, controller);
}

inherits(SenergyConnector, AutomationModule);
_module = SenergyConnector;

SenergyConnector.prototype.init = function (config) {
    console.log("Init SenergyConnector");
    var that = this;
    SenergyConnector.super_.prototype.init.call(that, config);
    that.initTimeout = setTimeout(function () {
        that.initTimeout = null;
        that.run(config);
    }, 10000) //ensure to be last init
};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    if(this.initTimeout){
        clearTimeout(this.initTimeout);
    }
    if(this.interval){
        clearInterval(this.interval);
    }
    if(this.connection){
        this.connection.disconnect();
    }
    SenergyConnector.super_.prototype.stop.call(this);
};

SenergyConnector.prototype.run = function (config) {
    var that = this;
    if(DEV){
        Modules.include("tests").run(that.controller, config);
    }else{
        var deviceManagerUrl = config.iot_repo_url;
        var authUrl = config.auth_url;
        var user = config.user;
        var password = config.password;
        that.handleCommands = config.handle_commands
        console.log("Command handling enabled?", that.handleCommands)
        console.log("Multi gateway mode?",  config.multi_gateway)

        that.connectionError = true; //initial connection without provisioning update

        that.connector = Modules.include("connector");
        that.provisioning = Modules.include("provisioning").init(that.controller, deviceManagerUrl, authUrl, user, password, config.multi_gateway);
        that.sendEvent = that.getSendEventHandler(config);

        that.interval = setInterval(function(){
            try{
                that.provisioning.run(function (ok, descriptions) {
                    if(descriptions){
                        that.descriptions = descriptions;
                    }
                    if(ok || that.connectionError){
                        that.updateConnection(config);
                    }
                });
            }catch (e) {
                console.log("ERROR: ", e.message, e.stack);
            }
        }, 60000);
    }
};

SenergyConnector.prototype.updateConnection = function (config) {
    var that = this;

    that.connectionError = false;

    var user = config.user;
    var password = config.password;
    var hubId = that.provisioning.hubIdProvider.get();
    var url = config.mqtt_url;

    if(that.connection){
        that.connection.disconnect();
        that.connection = null;
    }

    setTimeout(function () {
        that.connector.connect(url, hubId, user, password, function (connection) {
            console.log("SENERGY-CONNECTOR: updateConnection() plugin connect");
            that.connection = connection;
            that.initConnectionHandler(config);
        }, function (connection) {
            console.log("SENERGY-CONNECTOR: updateConnection() plugin disconnect");
            that.connection = null;
            that.connectionError = true;
            that.removeEventHandler();
            connection.disconnect();
        }, config.multi_gateway,
        function () {
            console.log("DM REFRESH REQUESTED!")
            that.provisioning.updateDevices({token: null}, that.descriptions); // only happens in mgw mode
        });
    }, 5000)

};

SenergyConnector.prototype.initConnectionHandler = function (config) {
    var that = this;
    that.provisioning.updateConnection(this.connection)
    if(that.descriptions){
        if (config.multi_gateway) {
            that.provisioning.updateDevices({token: null}, that.descriptions)
        }
        that.descriptions.forEach(function (desc) {
            var localDevice = desc.localId;
            desc.services.forEach(function (serviceDesc) {
                var localService = serviceDesc.localId;

                if(!localService){
                    return
                }

                //add event handler
                var vDev = that.provisioning.mapping.getVirtualDevice(localDevice, localService);
                var command = that.provisioning.mapping.getCommandName(localService);
                if(!vDev){
                    console.log("WARNING: unable to find device for", localDevice, localService)
                }else{
                    if(command == "get_level"){
                        that.addEventHandler(vDev);
                    }

                    //add command handler if needed
                    if (that.handleCommands) {
                        that.connection.registerCommand(localDevice, localService, function (deviceLocalId, serviceLocalId, payload) {
                            return that.handleCommand(deviceLocalId, serviceLocalId, payload);
                        })
                    }
                }
            });
        });
    }
};

SenergyConnector.prototype.handleCommand = function(deviceLocalId, serviceLocalId, payload){
    console.log("DEBUG: receive command: ", deviceLocalId, serviceLocalId, JSON.stringify(payload));
    var that = this;
    var vDev = that.provisioning.mapping.getVirtualDevice(deviceLocalId, serviceLocalId);
    var command = that.provisioning.mapping.getCommandName(serviceLocalId);
    if(vDev){
        if(command == "get_level"){
            return {level: vDev.get("metrics").level, updateTime: new Date(vDev.get("updateTime")*1000).toISOString()}
        }else{
            if(payload){
                vDev.performCommand(command, payload);
            }else{
                vDev.performCommand(command);
            }
        }
    }
    return null;
};

SenergyConnector.prototype.addEventHandler = function (vDev) {
    var that = this;
    console.log("DEBUG: listen to ", vDev.id);
    vDev.on("change:metrics:level", that.sendEvent);
};

SenergyConnector.prototype.removeEventHandler = function () {
    var that = this;
    if(that.sendEvent){
        that.controller.devices.forEach(function (vDev) {
            try{
                console.log("DEBUG: stop listening to ", vDev.id);
                vDev.off("change:metrics:level", that.sendEvent);
            }catch(e){
                console.log("unable to remove change:metrics:level:", e.message, e.stack);
            }
        });
    }
};

SenergyConnector.prototype.getSendEventHandler = function (config) {
    var that = this;
    return function (vDev) {
        try{
            var info = that.provisioning.mapping.getLocalIds(vDev, "get_level");
            if(that.connection){
                that.connection.sendEvent(
                    info.localDeviceId,
                    info.localServiceId,
                    {
                        level: vDev.get("metrics").level,
                        updateTime: new Date(vDev.get("updateTime")*1000).toISOString()
                    },
                    config.multi_gateway
                );
            }else{
                console.log("unable to send event: disconnected")
            }
        }catch (e) {
            console.log("ERROR: ", e.message, e.stack);
        }
    }
};
