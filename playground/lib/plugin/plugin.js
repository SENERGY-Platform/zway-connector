
function SenergyConnector (id, controller) {
    SenergyConnector.super_.call(this, id, controller);
}

inherits(SenergyConnector, AutomationModule);
_module = SenergyConnector;

SenergyConnector.prototype.init = function (config) {
    var that = this;
    console.log("Init SenergyConnector");
    SenergyConnector.super_.prototype.init.call(this, config);

    Modules.include("tests").run(this.controller, config)

};

SenergyConnector.prototype.stop = function () {
    console.log("Stop SenergyConnector");
    SenergyConnector.super_.prototype.stop.call(this);
};
