Modules.registerModule("provisioning/physical-devices", function (module) {

    //some documentation at https://zwayhomeautomation.docs.apiary.io/#reference/devices/virtual-device

    var PhysicalDevices = {};


    PhysicalDevices.getRaw = function(){
        if(global.ZWave && global.ZWave[ZWAY_MODULE_NAME]){
            return JSON.parse(global.ZWave[ZWAY_MODULE_NAME].Data("").body).devices;
        }else{
            return null
        }
    };

    PhysicalDevices.getDevice = function(raw, id) {
        //example:
        /*
        var result = {
            id: "38",
            name: "MCO Home CO2 Monitor",
            info: {
                givenName: {value: "Devolo Radiator Thermostat", type: "string", invalidateTime: 1574779354,…}
                manufacturerId: {value: 2, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                manufacturerProductId: {value: 373, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                manufacturerProductType: {value: 5, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                genericType: {value: 8, type: "int", invalidateTime: 1574779354, updateTime: 1574845736}
                specificType: {value: 4, type: "int", invalidateTime: 1574779354, updateTime: 1574845736}
                vendorString: {value: "Danfoss", type: "string", invalidateTime: 1574779354, updateTime: 1574779357}
            }
        }
        */

        var device = raw[id];
        if (!device || !device.instances || !device.instances["0"]) {
            return null;
        }
        var result = {
            id: id,
            name: device.data.givenName.value + " (#"+id+")",
            info: {
                givenName: device.data.givenName,
                manufacturerId: device.data.manufacturerId,
                manufacturerProductId: device.data.manufacturerProductId,
                manufacturerProductType: device.data.manufacturerProductType,
                genericType: device.data.genericType,
                specificType: device.data.specificType,
                vendorString: device.data.vendorString
            },
            sub:[]
        };
        return result;
    };


    /*
    {
        scale: "5",
        type_name: "SensorMultilevel",
        command_class_id:49,
        scale_info: {
            deviceScale: {value: 0, type: "int", invalidateTime: 1567169818, updateTime: 1574846430},
            deviceScaleString: {value: "°C", type: "string", invalidateTime: 1567169818, updateTime: 1574846430},
            invalidateTime: 1567169818,
            modeName: {value: "Heating", type: "string", invalidateTime: 1567169818, updateTime: 1567169817},
            scale: {value: 0, type: "int", invalidateTime: 1567169818, updateTime: 1567169817},
            scaleString: {value: "°C", type: "string", invalidateTime: 1567169818, updateTime: 1567169817},
            setVal: {value: 21, type: "float", invalidateTime: 1567169818, updateTime: 1574846430},
            type: "empty",
            updateTime: 1574846430,
            val: {value: 21, type: "float", invalidateTime: 1567169818, updateTime: 1574846430},
        }
    }
     */
    PhysicalDevices.getService = function(raw, deviceId, commandClassId, scale){
        var device = raw[deviceId];
        if (!device.instances || !device.instances["0"]) {
            return null;
        }
        var commandClasses = device.instances["0"].commandClasses;
        var commandClass = commandClasses[commandClassId];
        var typeName = commandClass.name;

        var result = {
            scale: scale,
            command_class_name: typeName,
            command_class_id:commandClassId
        };

        if(scale && commandClass.data[scale]){
            result.scale_info = PhysicalDevices.scaleInfo(commandClass.data[scale])
        }
        return result
    };

    PhysicalDevices.scaleInfo = function (rawScaleInfo) {
        var result = {};
        for(var field in rawScaleInfo){
            if(rawScaleInfo[field] && rawScaleInfo[field].type && rawScaleInfo[field].type == "string"){
                result[field] =  rawScaleInfo[field].value;
            }
        }
        return result
    };

    return PhysicalDevices
});
