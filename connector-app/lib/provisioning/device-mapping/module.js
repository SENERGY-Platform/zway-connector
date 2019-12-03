Modules.registerModule("provisioning/device-mapping", function (module) {

    //some documentation at https://zwayhomeautomation.docs.apiary.io/#reference/devices/virtual-device

    return {
        init: function (controller) {
            var result = {
                uuid: null,
                typemap: null,

                /*
                    localDeviceId = localPrefix + "-" + id
                                    e.g. "foo-19"
                    localServiceId = command + ":" + sub.command_class_id + "-" + sub.id + "-" + vDev_rest
                                    e.g. "exact:113-7-3-A"
                */
                getVirtualDevice: function (localDeviceId, localServiceId) {
                    var device = null;
                    var localDeviceIdParts = localDeviceId.split("-");
                    var nodeId = localDeviceIdParts[localDeviceIdParts.length - 1];
                    var localServiceIdParts = localServiceId.split(":");
                    var commandClassLocation = localServiceIdParts[localServiceIdParts.length - 1];
                    var suffix = [nodeId, "0", commandClassLocation].join("-");
                    controller.devices.forEach(function (vDev) {
                        if(vDev.id.endsWith(suffix)){
                            device = vDev;
                        }
                    });
                    return device
                },


                // virtualDevice.id = "ZWayVDev_zway_19-0-113-7-3-A"
                // commando = "exact"
                // returns {localDeviceId: "uuid-19", localServiceId: "exact:113-7-3-A"}
                getLocalIds: function(virtualDevice, commando){
                    var temp = result.getLocalIdControllerPart(virtualDevice.id);
                    var localServiceId = result.getLocalServiceId(temp.controllerAddress, commando);
                    return {localDeviceId: temp.localDeviceId, localServiceId: localServiceId}
                },

                getLocalIdControllerPart: function(virtualDeviceId){
                    var parts = virtualDeviceId.split("_");
                    var idParts = parts[parts.length-1].split("-");
                    var nodeId = idParts[0];
                    var localDeviceId = result.getLocalDeviceId(nodeId);
                    var controllerAddress = idParts.slice(2).join("-");
                    return {localDeviceId: localDeviceId, controllerAddress: controllerAddress}
                },

                getLocalServiceId: function(controllerAddress, command){
                    return command + ":" + controllerAddress;
                },

                getLocalDeviceId: function(nodeId){
                    return result.getLocalPrefix() + "-" + nodeId
                },

                /*
                    deviceInfo = {
                        givenName: {value: "Devolo Radiator Thermostat", type: "string", invalidateTime: 1574779354,…}
                        manufacturerId: {value: 2, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                        manufacturerProductId: {value: 373, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                        manufacturerProductType: {value: 5, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                        genericType: {value: 8, type: "int", invalidateTime: 1574779354, updateTime: 1574845736}
                        specificType: {value: 4, type: "int", invalidateTime: 1574779354, updateTime: 1574845736}
                        vendorString: {value: "Danfoss", type: "string", invalidateTime: 1574779354, updateTime: 1574779357}
                    }
                 */
                getDeviceTypeId: function(deviceInfo){
                    var ref = result.getDeviceTypeIdMappingRef(deviceInfo);
                    return result.getDeviceTypeIdByMappingRef(ref)
                },

                /*
                    deviceInfo = {
                        givenName: {value: "Devolo Radiator Thermostat", type: "string", invalidateTime: 1574779354,…}
                        manufacturerId: {value: 2, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                        manufacturerProductId: {value: 373, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                        manufacturerProductType: {value: 5, type: "int", invalidateTime: 1574779354, updateTime: 1574779357}
                        genericType: {value: 8, type: "int", invalidateTime: 1574779354, updateTime: 1574845736}
                        specificType: {value: 4, type: "int", invalidateTime: 1574779354, updateTime: 1574845736}
                        vendorString: {value: "Danfoss", type: "string", invalidateTime: 1574779354, updateTime: 1574779357}
                    }
                 */
                getDeviceTypeIdMappingRef: function(deviceInfo){
                    return deviceInfo.manufacturerId.value + "-" + deviceInfo.manufacturerProductType.value + "-" + deviceInfo.manufacturerProductId.value
                },

                //ref = getDeviceTypeIdMappingRef()
                getDeviceTypeIdByMappingRef: function(ref){
                    if(!result.typemap){
                        result.typemap = Modules.loadJson("typemapping.json")
                    }
                    return result.typemap[ref] || null
                },

                getVirtualDevices: function(){
                    return controller.devices
                },

                /*
                     physicalDevice = {
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

                    returns {
                        name: "",
                        localId: "",
                        deviceTypeMappingRef: "",
                        deviceTypeId: "",
                        services: [
                            {
                                localId: "",
                                comment: "",
                                inputExample: {type: "string|integer|float|object", example:42, comment: ""},
                                outputExample: {type: "string|integer|float|object", example:42, comment: ""},
                                info: physicalDevice.sub.info
                            }
                        ]
                    }

                 */
                getDeviceDescription: function(physicalDevice, virtualDevices){
                    var mappingRef = result.getDeviceTypeIdMappingRef(physicalDevice.info);
                    var deviceDescription = {
                        localId: result.getLocalDeviceId(physicalDevice.id),
                        name: physicalDevice.name,
                        deviceTypeMappingRef: mappingRef,
                        deviceTypeId: result.getDeviceTypeIdByMappingRef(mappingRef),
                        services:[],
                    };
                    physicalDevice.sub.forEach(function (sub) {
                        virtualDevices.forEach(function (vDev) {
                            var parts = vDev.id.split("_");
                            var idParts = parts[parts.length-1].split("-");
                            var nodeId = idParts[0];
                            var commandClassLocation = idParts.slice(2).join("-");  //e.g. "113-7-3-A"
                            var expectedCommandClassLocationPrefix = sub.command_class_id+"-"+sub.id;
                            if(nodeId == physicalDevice.id && commandClassLocation.startsWith(expectedCommandClassLocationPrefix)){
                                var localIdInfo = result.getLocalIdControllerPart(vDev.id);
                                switch(sub.type_name.toLowerCase()){
                                    case "battery".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: 42, updateTime:"date and time as string"}});
                                        break;
                                    case "doorlock".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: "unknown-type", updateTime:"date and time as string"}});
                                        var open = result.getLocalServiceId(localIdInfo.controllerAddress, "open");
                                        deviceDescription.services.push({localId: open, info: sub.info});
                                        var close = result.getLocalServiceId(localIdInfo.controllerAddress, "close");
                                        deviceDescription.services.push({localId: close, info: sub.info});
                                        break;
                                    case "thermostat".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: 42.2, updateTime:"date and time as string"}});
                                        var exact = result.getLocalServiceId(localIdInfo.controllerAddress, "exact");
                                        deviceDescription.services.push({localId: exact, info: sub.info, inputExample:{level: 42.2}});
                                        break;
                                    case "toggleButton".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: "on|off", updateTime:"date and time as string"}});
                                        var on = result.getLocalServiceId(localIdInfo.controllerAddress, "on");
                                        deviceDescription.services.push({localId: on, info: sub.info});
                                        break;
                                    case "switchBinary".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: "on|off", updateTime:"date and time as string"}});
                                        var on = result.getLocalServiceId(localIdInfo.controllerAddress, "on");
                                        deviceDescription.services.push({localId: on, info: sub.info});
                                        var off = result.getLocalServiceId(localIdInfo.controllerAddress, "off");
                                        deviceDescription.services.push({localId: off, info: sub.info});
                                        var update = result.getLocalServiceId(localIdInfo.controllerAddress, "update");
                                        deviceDescription.services.push({localId: update, info: sub.info});
                                        break;
                                    case "sensorBinary".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: "on|off", updateTime:"date and time as string"}});
                                        var update = result.getLocalServiceId(localIdInfo.controllerAddress, "update");
                                        deviceDescription.services.push({localId: update, info: sub.info});
                                        break;
                                    case "switchMultilevel".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: 42, updateTime:"date and time as string"}});
                                        var exact = result.getLocalServiceId(localIdInfo.controllerAddress, "exact");
                                        deviceDescription.services.push({localId: exact, info: sub.info, inputExample:{level: 42}});
                                        var update = result.getLocalServiceId(localIdInfo.controllerAddress, "update");
                                        deviceDescription.services.push({localId: update, info: sub.info});
                                        break;
                                    case "sensorMultilevel".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: 42, updateTime:"date and time as string"}});
                                        var update = result.getLocalServiceId(localIdInfo.controllerAddress, "update");
                                        deviceDescription.services.push({localId: update, info: sub.info});
                                        break;
                                    case "switchControl".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: 42, updateTime:"date and time as string"}});
                                        var on = result.getLocalServiceId(localIdInfo.controllerAddress, "on");
                                        deviceDescription.services.push({localId: on, info: sub.info});
                                        var off = result.getLocalServiceId(localIdInfo.controllerAddress, "off");
                                        deviceDescription.services.push({localId: off, info: sub.info});
                                        var upstart = result.getLocalServiceId(localIdInfo.controllerAddress, "upstart");
                                        deviceDescription.services.push({localId: upstart, info: sub.info});
                                        var upstop = result.getLocalServiceId(localIdInfo.controllerAddress, "upstop");
                                        deviceDescription.services.push({localId: upstop, info: sub.info});
                                        var downstart = result.getLocalServiceId(localIdInfo.controllerAddress, "downstart");
                                        deviceDescription.services.push({localId: downstart, info: sub.info});
                                        var downstop = result.getLocalServiceId(localIdInfo.controllerAddress, "downstop");
                                        deviceDescription.services.push({localId: downstop, info: sub.info});
                                        var exact = result.getLocalServiceId(localIdInfo.controllerAddress, "exact");
                                        deviceDescription.services.push({localId: exact, info: sub.info, inputExample:{level: 42}});
                                        break;
                                    case "switchRGB".toLowerCase():
                                        var getLevel = result.getLocalServiceId(localIdInfo.controllerAddress, "get_level");
                                        deviceDescription.services.push({localId: getLevel, info: sub.info, outputExample:{level: "unknown-type", updateTime:"date and time as string"}});
                                        var getColor = result.getLocalServiceId(localIdInfo.controllerAddress, "get_color");
                                        deviceDescription.services.push({localId: getColor, info: sub.info, outputExample:{color: {r:255, g:255, b:255}, updateTime:"date and time as string"}});
                                        var exact = result.getLocalServiceId(localIdInfo.controllerAddress, "exact");
                                        deviceDescription.services.push({localId: exact, info: sub.info, inputExample:{red:255, green:255, blue:255}});
                                        var on = result.getLocalServiceId(localIdInfo.controllerAddress, "on");
                                        deviceDescription.services.push({localId: on, info: sub.info});
                                        var off = result.getLocalServiceId(localIdInfo.controllerAddress, "off");
                                        deviceDescription.services.push({localId: off, info: sub.info});
                                        break;
                                    default:
                                        deviceDescription.services.push({info: sub.info, comment: "unknown command class: "+sub.type_name});
                                }
                            }
                        });
                    });
                    return deviceDescription;
                },

                getDeviceDescriptions: function(physicalDevices, vDevs /*optional*/){
                    if(!vDevs){
                        vDevs = result.getVirtualDevices();
                    }
                    return Modules.helper.map(physicalDevices,function (device) {
                        return result.getDeviceDescription(device, vDevs)
                    })
                },

                getLocalPrefix: function(){
                    if(controller.uuid){
                        return controller.uuid;
                    }
                    if(!result.uuid){
                        try{
                            if(global.ZWave && global.ZWave[ZWAY_MODULE_NAME]){
                                result.uuid = JSON.parse(global.ZWave[ZWAY_MODULE_NAME].Data("").body).controller.data.uuid.value;
                            }
                        }catch (e) {
                            console.log("ERROR:", e);
                            return null
                        }
                    }
                    return result.uuid
                }
            };
            return result
        }
    };
});
