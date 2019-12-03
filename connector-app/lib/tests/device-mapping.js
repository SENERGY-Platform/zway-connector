Tests["device-mapping.getLocalPrefix()"] = function (ctx) {
   var prefix = Modules.include("provisioning/device-mapping").init(ctx.controller).getLocalPrefix();
   console.log("LOG device-mapping.getLocalPrefix():", prefix);
   if(prefix){
       return null
   }else{
       return "prefix not found"
   }
};

Tests["device-mapping.getVirtualDevices()"] = function (ctx) {
    var vDevs = Modules.include("provisioning/device-mapping").init(ctx.controller).getVirtualDevices();
    if(vDevs){
        return null
    }else{
        return "not found"
    }
};

Tests["device-mapping.getDeviceDescriptions"] = function (ctx) {
    var mapping = Modules.include("provisioning/device-mapping").init(ctx.controller);
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
    var descriptions = mapping.getDeviceDescriptions(physicalDevices, vDevs);
    if(!descriptions){
        return "missing descriptions"
    }
    if(TestHelper.equal(expected, descriptions)){
        return null
    }else{
        console.log("DEBUG: getDeviceDescriptions() = ", JSON.stringify(descriptions) );
        return "unexpected result"
    }
};
