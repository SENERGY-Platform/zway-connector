Modules.registerModule("provisioning/physical-devices", function (module) {

    //some documentation at https://zwayhomeautomation.docs.apiary.io/#reference/devices/virtual-device

    var PhysicalDevices = {getDevices: function () {/*returns list of physical devices*/}};

    PhysicalDevices.getDevices = function(){
        var result = [];

        var pysicalDevices = {};
        if(global.ZWave && global.ZWave[ZWAY_MODULE_NAME]){
            pysicalDevices = JSON.parse(global.ZWave[ZWAY_MODULE_NAME].Data("").body).devices;
        }

        console.log("DEBUG: getDevices(); internal devices data:", JSON.stringify(pysicalDevices));

        for (var id in pysicalDevices) {
            if( pysicalDevices.hasOwnProperty(id) && !isNaN(id) ) {
                var device = PhysicalDevices.getDevice(id, pysicalDevices);
                if (device) {
                    result.push(device)
                }
            }
        }
        return result
    };

    PhysicalDevices.getDevice = function(id, descriptions) {
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
            },
            sub: [
                {
                    id: "5",
                    type_name: "SensorMultilevel",
                    command_class_id:49,
                    info: {
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
            ]
        }
        */

        var device = descriptions[id];
        if (!device.instances || device.instances.length != 1) {
            console.log("DEBUG: getDevice() no instances:", JSON.stringify(device));
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

        var commandClases = device.instances[0].commandClasses;
        for (var commandClassId in commandClases) {
            if( commandClases.hasOwnProperty(commandClassId) && !isNaN(commandClassId) ) {
                var sub = PhysicalDevices.getSubDevices(commandClassId, commandClases);
                if (sub) {
                    result.sub.concat(sub)
                }
            }
        }
        return result;
    };


    PhysicalDevices.getSubDevices = function (commandClassId, commandClasses) {
        var result = [];
        var commandClass = commandClasses[commandClassId];
        if (!commandClass || !commandClass.data) {
            console.log("DEBUG: getSubDevices() no commandClass:", JSON.stringify(commandClass));
            return result;
        }
        var type_name = commandClass.name;
        for (var id in commandClass.data){
            if( commandClass.data.hasOwnProperty(id) && !isNaN(id) ) {
                var sub = PhysicalDevices.getSubDevice(id, commandClass.data, commandClassId, type_name);
                if (sub) {
                    result.push(sub)
                }
            }
        }
        return result;
    };


    PhysicalDevices.getSubDevice = function(id, data, commandClassId, type_name) {
        var sub = data[id];
        if (!sub){
            console.log("DEBUG: getSubDevice() no sub device:", JSON.stringify(sub));
            return null
        }
        return {
            id: id,
            command_class_id: commandClassId,
            type_name: type_name,
            info: sub
        }
    };

    return PhysicalDevices
});
