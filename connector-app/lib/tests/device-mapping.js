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
    console.log("LOG device-mapping.getVirtualDevices():", JSON.stringify(vDevs));
    if(vDevs){
        return null
    }else{
        return "not found"
    }
};

Tests["device-mapping.getDeviceDescriptions"] = function (ctx) {
    var mapping = Modules.include("provisioning/device-mapping").init(ctx.controller);
    var physicalDevices = Modules.include("provisioning/physical-devices").getDevices();
    console.log("DEBUG: TEST: device-mapping.getDeviceDescriptions: \n",JSON.stringify(mapping.getDeviceDescriptions(physicalDevices)));
    return null
};
