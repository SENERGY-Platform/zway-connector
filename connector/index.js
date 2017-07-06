
function SeplConnector (id, controller) {
    SeplConnector.super_.call(this, id, controller);
}

inherits(SeplConnector, AutomationModule);
_module = SeplConnector;


SeplConnector.prototype.init = function (config) {
    console.log("Start SeplConnector");
    SeplConnector.super_.prototype.init.call(this, config);
    this.client = SeplConnectorClient(config.sepl_url, config.user, config.password);
    this.client.start();
};


SeplConnector.prototype.stop = function () {
    console.log("Start SeplConnector");
    this.client.stop();
    SeplConnector.super_.prototype.stop.call(this);
};
