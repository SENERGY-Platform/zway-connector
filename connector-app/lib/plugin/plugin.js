
function SenergyConnector (id, controller) {
    SenergyConnector.super_.call(this, id, controller);
}

inherits(SenergyConnector, AutomationModule);
_module = SenergyConnector;

SenergyConnector.prototype.init = function (config) {
    var that = this;
    that.initTimeout = setTimeout(function () {
        that.initTimeout = null;
        console.log("Init SenergyConnector");
        SenergyConnector.super_.prototype.init.call(that, config);
        Modules.include("tests").run(that.controller, config)
    }, 10000) //ensure to be last init
};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    if(this.initTimeout){
        clearTimeout(this.initTimeout);
    }
    SenergyConnector.super_.prototype.stop.call(this);
};
