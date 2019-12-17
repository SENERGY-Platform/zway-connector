Tests["provisioning"]=function (ctx) {
    //return SKIP;

    var deviceManagerUrl = ctx.config.iot_repo_url;
    var authUrl = ctx.config.auth_url;
    var user = ctx.config.user;
    var password = ctx.config.password;
    var senergyClientId = "client-connector-lib";
    var uuid = "testuuid";

    var devicesModule = Modules.include("provisioning/physical-devices");

    var physicalDevices = Modules.loadJson("lib/tests/resources/physical-devices-raw.json");
    var vDevs = Modules.loadJson("lib/tests/resources/virtual-devices.json");
    if(!vDevs){
        return "missing vDevs"
    }
    if(!physicalDevices){
        return "missing physicalDevices"
    }

    var controllerMock = {devices: vDevs, uuid: uuid};
    var mapping = Modules.include("provisioning/device-mapping").init(controllerMock, devicesModule);

    //mock raw physical devices
    var getRawImpl = devicesModule.getRaw;
    devicesModule.getRaw = function () {
        return physicalDevices;
    };

    var platformDevices = Modules.include("provisioning/platform-devices").init(deviceManagerUrl, authUrl, senergyClientId);
    var hubIdProvider = Modules.include("provisioning/hubid");

    var provisioning = Modules.include("provisioning").initWithModules(platformDevices, mapping, hubIdProvider, user, password);

    provisioning.run(function (changed, descriptions) {
        console.log("TEST-RESULT-PROVISIONING: run()", changed);
    });

    //remove raw mock
    devicesModule.getRaw = getRawImpl;

    return null;
};
