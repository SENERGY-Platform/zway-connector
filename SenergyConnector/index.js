
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

    setTimeout(function(){
        executeFile("userModules/SenergyConnector/provisioning.js");
        executeFile("userModules/SenergyConnector/zwayhelper.js");
        executeFile("userModules/SenergyConnector/connector.js");
        self.start(config)
    }, config.startupdelay*1000);

};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    SenergyConnector.super_.prototype.stop.call(this);
};


SenergyConnector.prototype.start = function (config) {
    var self = this;
    var restarttime = 10000;
    console.log("Start SenergyConnector");
    var result = login(config.auth_url, SenergyClientId, config.user, config.password);
    if(result.err){
        console.log("login error:", JSON.stringify(result.err));
        setTimeout(function(){
            self.start(config)
        }, restarttime);
        return
    }
    var token = result.token;
    var devices = getZwayDevices(this.controller);
    provisionHub(config.iot_repo_url, token, "", devices, hubIdProvider, function(result){
        if(result.err){
            console.log("ERROR: provisioning error:", JSON.stringify(result.err));
            console.log("DEBUG: reconnect in ",restarttime);
            setTimeout(function(){
                self.start(config)
            }, restarttime);
            return
        }
    });
};

