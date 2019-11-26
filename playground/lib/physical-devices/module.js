Modules.registerModule("physical-devices", function (module) {

    var PhysicalDevices = {getDevices: function (controller) {/*returns list of physical devices*/}};

    PhysicalDevices.getDevices = function(controller){
        //TODO: configuratable zway name (zway == Z-Wave Network Access.config.name (internalName))
        zwayModuleName = "zway";

        var result = [];

        var pysicalDevices = {};
        if(global.ZWave && global.ZWave[zwayModuleName]){
            pysicalDevices = JSON.parse(global.ZWave[zwayModuleName].Data("").body).devices;
        }

        for (var id in pysicalDevices) {
            if( pysicalDevices.hasOwnProperty(id) && !isNaN(id) ) {
                var device = PhysicalDevices.getDevice(id, pysicalDevices);
                if (device) {
                    result.push(device)
                }
            }
        }

        console.log("DEBUG:", JSON.stringify(result));
        return result
    };

    PhysicalDevices.getDevice = function(id, descriptions) {
        //example:
        /*
        var result = {
            id: "38",
            name: "MCO Home CO2 Monitor",
            sub: [
                {
                    id: "5",
                    type_name: "SensorMultilevel",
                    type_id:49,
                    sensor_type: "Humidity",
                    scale: "ppm"
                }
            ]
        }
        */

        var device = descriptions[id];
        if (!device.instances || device.instances.length != 1) {
            return null;
        }
        var result = {id: id, name: device.data.givenName.value, sub:[]};

        var commandClases = device.instances[0].commandClasses;
        for (var type_id in commandClases) {
            if( commandClases.hasOwnProperty(type_id) && !isNaN(type_id) ) {
                var sub = PhysicalDevices.getSubDevices(type_id, commandClases);
                if (sub) {
                    result.sub.concat(sub)
                }
            }
        }
        return result;
    };


    PhysicalDevices.getSubDevices = function (type_id, commandClasses) {
        var result = [];
        var commandClass = commandClasses[type_id];
        if (!commandClass || !commandClass.data) {
            return result;
        }
        var type_name = commandClass.name;
        for (var id in commandClass.data){
            if( commandClass.data.hasOwnProperty(id) && !isNaN(id) ) {
                var sub = PhysicalDevices.getSubDevice(id, commandClass.data, type_id, type_name);
                if (sub) {
                    result.push(sub)
                }
            }
        }
        return result;
    };


    PhysicalDevices.getSubDevice = function(id, data, type_id, type_name) {
        var sub = data[id];
        if (!sub){
            return null
        }
        return {
            id: id,
            type_id: type_id,
            type_name: type_name,
            sensor_type: sub.sensorTypeString.value,
            scale: sub.scale.value,
        }
    };

    return PhysicalDevices
});
