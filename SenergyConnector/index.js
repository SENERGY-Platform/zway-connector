
function SenergyConnector (id, controller) {
    SenergyConnector.super_.call(this, id, controller);
}

inherits(SenergyConnector, AutomationModule);
_module = SenergyConnector;


const SenergyClientId = "client-connector-lib";

SenergyConnector.prototype.init = function (config) {
    console.log("Start SenergyConnector with delay: ", config.startupdelay, "s");
    SenergyConnector.super_.prototype.init.call(this, config);
    var self = this;
    this.config = config;

    executeFile("userModules/SenergyConnector/provisioning.js");
    executeFile("userModules/SenergyConnector/zwayhelper.js");
    executeFile("userModules/SenergyConnector/connector.js");
    self.start()
};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    SenergyConnector.super_.prototype.stop.call(this);
};


SenergyConnector.prototype.start = function () {
    console.log("Start SenergyConnector");
    this.provisioning();
    var that = this;
    setInterval(function(){that.provisioning()}, 15000)
};

SenergyConnector.prototype.provisioning = function () {
    var config = this.config;
    var devices = getZwayDevices(this.controller);
    var hash = devicesHash(devices);
    var that = this;
    console.log("DEBUG: local provision check", JSON.stringify(this.hash), JSON.stringify(hash));
    if(this.hash != hash){
        console.log("DEBUG: update provisioning");
        var result = login(config.auth_url, SenergyClientId, config.user, config.password);
        if(result.err){
            console.log("login error:", JSON.stringify(result.err));
            return
        }
        var token = result.token;
        provisionHub(config.iot_repo_url, token, "", devices, hubIdProvider, function(result){
            if(result.err){
                console.log("ERROR: provisioning error:", JSON.stringify(result.err));
                return
            }
            that.hash = hash;
            that.updateConnection(devices)
        });
    }
};

SenergyConnector.prototype.updateConnection = function () {
    console.log("Update Senergy-MQTT-Connection");
};
