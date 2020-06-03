Tests["device-mapping.getLocalPrefix()"] = function (ctx) {
    return SKIP;
    var prefix = Modules.include("provisioning/device-mapping").init(ctx.controller).getLocalPrefix();
    console.log("LOG device-mapping.getLocalPrefix():", prefix);
    if(prefix){
       return null
    }else{
       return "prefix not found"
    }
};

Tests["device-mapping.getVirtualDevices()"] = function (ctx) {
    return SKIP;
    var vDevs = Modules.include("provisioning/device-mapping").init(ctx.controller).getVirtualDevices();
    if(vDevs){
        return null
    }else{
        return "not found"
    }
};

Tests["device-mapping.getDeviceDescriptions"] = function (ctx) {
    return SKIP;
    var devicesModule = Modules.include("provisioning/physical-devices");

    var physicalDevices = Modules.loadJson("lib/tests/resources/physical-devices-raw.json");
    var vDevs = Modules.loadJson("lib/tests/resources/virtual-devices.json");
    var expected = Modules.loadJson("lib/tests/resources/device-descriptions-expected.json");
    if(!expected){
        return "missing expected"
    }
    if(!vDevs){
        return "missing vDevs"
    }
    if(!physicalDevices){
        return "missing physicalDevices"
    }
    var controllerMock = {devices: vDevs};
    var mapping = Modules.include("provisioning/device-mapping").init(controllerMock, devicesModule);

    //mock raw physical devices
    var getRawImpl = devicesModule.getRaw;
    devicesModule.getRaw = function () {
        return physicalDevices;
    };

    //mock prefix
    var prefixFunctionImpl = mapping.getLocalPrefix;
    mapping.getLocalPrefix = function () {
        return "testuuid"
    };

    //run tested function
    var descriptions = mapping.getDeviceDescriptions(mapping.getVirtualDevices());

    //remove prefix mock
    mapping.getLocalPrefix = prefixFunctionImpl;

    //remove raw mock
    devicesModule.getRaw = getRawImpl;

    if(!descriptions){
        return "missing descriptions"
    }
    if(TestHelper.equal(JSON.parse(JSON.stringify(expected)), JSON.parse(JSON.stringify(descriptions)))){
        return null
    }else{
        console.log("TEST-RESULT-ERROR: \n\n", JSON.stringify(descriptions), "\n\n",  JSON.stringify(expected));
        return "unexpected result"
    }
};
