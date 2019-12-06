Tests["provisioning"]=function (ctx) {
    return SKIP;

    var deviceManagerUrl = ctx.config.iot_repo_url;
    var authUrl = ctx.config.auth_url;
    var user = ctx.config.user;
    var password = ctx.config.password;
    var senergyClientId = "client-connector-lib";
    var uuid = "testuuid";

    var devices = Modules.loadJson("lib/tests/resources/physical-devices-expected.json");
    var vDevs = Modules.loadJson("lib/tests/resources/virtual-devices.json");

    var controller = Modules.include("tests/mocks/controller");
    controller.mockSetDevices(vDevs);
    controller.mockSetUUID(uuid);

    var physicalDevices = Modules.include("tests/mocks/physical-devices");
    physicalDevices.mockSetDevices(devices);

    var platformDevices = Modules.include("provisioning/platform-devices").init(deviceManagerUrl, authUrl, senergyClientId);
    var mapping = Modules.include("provisioning/device-mapping").init(controller);
    var hubIdProvider = Modules.include("provisioning/hubid");

    var provisioning = Modules.include("provisioning").initWithModules(physicalDevices, platformDevices, mapping, hubIdProvider, user, password);

    provisioning.run(function (changed, descriptions) {
        console.log("TEST-RESULT-PROVISIONING: run()", changed);
    });

    return null;
};
