Modules.registerModule("provisioning/device-mapping", function (module) {

    //some documentation at https://zwayhomeautomation.docs.apiary.io/#reference/devices/virtual-device

    return {
        init: function (controller, physicalDevices) {
            var mapping = {
                uuid: null,
                typemap: null,

                //in: "ZWayVDev_zway_19-0-113-7-3-A", out: {device: "19", instance: "0" command_class: "113", scale: "7", rest: "3-A", controller_address: "113-7-3-A"}
                //in: "ZWayVDev_zway_19-0-113", out: {device: "19", instance: "0" command_class: "113", scale: null, rest: null, controller_address: "113"}
                parseVDevId: function(id){
                    var parts = id.split("_");
                    var idParts = parts[parts.length-1].split("-");
                    var controllerAddress = idParts.slice(2).join("-");
                    return {device: idParts[0], instance:idParts[1], command_class:idParts[2], scale: idParts[3]||null, rest: idParts.slice(4).join("-")||null, controller_address:controllerAddress}
                },

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
                    var suffix = [nodeId, "0", commandClassLocation].join("-"); //
                    controller.devices.forEach(function (vDev) {
                        if(vDev.id.endsWith("_"+suffix)){
                            device = vDev;
                        }
                    });
                    return device
                },

                getVirtualDeviceById: function (id) {
                    return controller.devices.get(id)
                },

                //localServiceId = "exact:113-7-3-A"
                //returns "exact"
                getCommandName: function(localServiceId){
                    return localServiceId.split(":")[0]
                },


                // virtualDevice.id = "ZWayVDev_zway_19-0-113-7-3-A"
                // commando = "exact"
                // returns {localDeviceId: "uuid-19", localServiceId: "exact:113-7-3-A"}
                getLocalIds: function(virtualDevice, commando){
                    var temp = mapping.getLocalIdControllerPart(virtualDevice.id);
                    var localServiceId = mapping.getLocalServiceId(temp.controllerAddress, commando);
                    return {localDeviceId: temp.localDeviceId, localServiceId: localServiceId}
                },

                getLocalIdControllerPart: function(virtualDeviceId){
                    var parts = virtualDeviceId.split("_");
                    var idParts = parts[parts.length-1].split("-");
                    var nodeId = idParts[0];
                    var localDeviceId = mapping.getLocalDeviceId(nodeId);
                    var controllerAddress = idParts.slice(2).join("-");
                    return {localDeviceId: localDeviceId, controllerAddress: controllerAddress}
                },

                getLocalServiceId: function(controllerAddress, command){
                    return command + ":" + controllerAddress;
                },

                getLocalDeviceId: function(nodeId){
                    return mapping.getLocalPrefix() + "-" + nodeId
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
                    var ref = mapping.getDeviceTypeIdMappingRef(deviceInfo);
                    return mapping.getDeviceTypeIdByMappingRef(ref)
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
                    if(!mapping.typemap){
                        mapping.typemap = Modules.loadJson("typemapping.json")
                    }
                    return mapping.typemap[ref] || null
                },

                getVirtualDevices: function(){
                    return controller.devices
                },

                /*
                     [
                            {
                                type: "",
                                v_dev_id
                                localId: "",
                                comment: "",
                                inputExample: {type: "string|integer|float|object", example:42, comment: ""},
                                outputExample: {type: "string|integer|float|object", example:42, comment: ""},
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
                 */
                getServiceDescriptions: function(rawDevices, vDevOrig){
                    var vDev = JSON.parse(JSON.stringify(vDevOrig));
                    var vDevInfo = mapping.parseVDevId(vDev.id);
                    var result = [];
                    var service = physicalDevices.getService(rawDevices, vDevInfo.device, vDevInfo.command_class, vDevInfo.scale);
                    var deviceType = vDev.deviceType || "";
                    switch(deviceType.toLowerCase()){
                        case "":
                            break;
                        case "battery".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: 42, updateTime:"date and time as string"}});
                            break;
                        case "doorlock".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: "unknown-type", updateTime:"date and time as string"}});
                            var open = mapping.getLocalServiceId(vDevInfo.controller_address, "open");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: open, info: service.scale_info});
                            var close = mapping.getLocalServiceId(vDevInfo.controller_address, "close");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: close, info: service.scale_info});
                            break;
                        case "thermostat".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: 42.2, updateTime:"date and time as string"}});
                            var exact = mapping.getLocalServiceId(vDevInfo.controller_address, "exact");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: exact, info: service.scale_info, inputExample:{level: 42.2}});
                            break;
                        case "toggleButton".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: "on|off", updateTime:"date and time as string"}});
                            var on = mapping.getLocalServiceId(vDevInfo.controller_address, "on");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: on, info: service.scale_info});
                            break;
                        case "switchBinary".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: "on|off", updateTime:"date and time as string"}});
                            var on = mapping.getLocalServiceId(vDevInfo.controller_address, "on");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: on, info: service.scale_info});
                            var off = mapping.getLocalServiceId(vDevInfo.controller_address, "off");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: off, info: service.scale_info});
                            var update = mapping.getLocalServiceId(vDevInfo.controller_address, "update");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: update, info: service.scale_info});
                            break;
                        case "sensorBinary".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: "on|off", updateTime:"date and time as string"}});
                            var update = mapping.getLocalServiceId(vDevInfo.controller_address, "update");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: update, info: service.scale_info});
                            break;
                        case "switchMultilevel".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: 42, updateTime:"date and time as string"}});
                            var exact = mapping.getLocalServiceId(vDevInfo.controller_address, "exact");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: exact, info: service.scale_info, inputExample:{level: 42}});
                            var on = mapping.getLocalServiceId(vDevInfo.controller_address, "on");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: on, info: service.scale_info});
                            var off = mapping.getLocalServiceId(vDevInfo.controller_address, "off");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: off, info: service.scale_info});
                            var update = mapping.getLocalServiceId(vDevInfo.controller_address, "update");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: update, info: service.scale_info});
                            break;
                        case "sensorMultilevel".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: 42, updateTime:"date and time as string"}});
                            var update = mapping.getLocalServiceId(vDevInfo.controller_address, "update");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: update, info: service.scale_info});
                            break;
                        case "switchControl".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: 42, updateTime:"date and time as string"}});
                            var on = mapping.getLocalServiceId(vDevInfo.controller_address, "on");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: on, info: service.scale_info});
                            var off = mapping.getLocalServiceId(vDevInfo.controller_address, "off");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: off, info: service.scale_info});
                            var upstart = mapping.getLocalServiceId(vDevInfo.controller_address, "upstart");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: upstart, info: service.scale_info});
                            var upstop = mapping.getLocalServiceId(vDevInfo.controller_address, "upstop");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: upstop, info: service.scale_info});
                            var downstart = mapping.getLocalServiceId(vDevInfo.controller_address, "downstart");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: downstart, info: service.scale_info});
                            var downstop = mapping.getLocalServiceId(vDevInfo.controller_address, "downstop");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: downstop, info: service.scale_info});
                            var exact = mapping.getLocalServiceId(vDevInfo.controller_address, "exact");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: exact, info: service.scale_info, inputExample:{level: 42}});
                            break;
                        case "switchRGB".toLowerCase():
                            var getLevel = mapping.getLocalServiceId(vDevInfo.controller_address, "get_level");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getLevel, info: service.scale_info, outputExample:{level: "unknown-type", updateTime:"date and time as string"}});
                            var getColor = mapping.getLocalServiceId(vDevInfo.controller_address, "get_color");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: getColor, info: service.scale_info, outputExample:{color: {r:255, g:255, b:255}, updateTime:"date and time as string"}});
                            var exact = mapping.getLocalServiceId(vDevInfo.controller_address, "exact");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: exact, info: service.scale_info, inputExample:{red:255, green:255, blue:255}});
                            var on = mapping.getLocalServiceId(vDevInfo.controller_address, "on");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: on, info: service.scale_info});
                            var off = mapping.getLocalServiceId(vDevInfo.controller_address, "off");
                            result.push({type: vDev.deviceType, vDevId: vDev.id, commandClass: service.command_class_name, localId: off, info: service.scale_info});
                            break;
                        default:
                            console.log("WARNING unknown command class", vDev.deviceType,  JSON.stringify(service));
                    }
                    return result;
                },

                getDeviceDescriptions: function(){
                    var deviceIndex = {};
                    var result = [];
                    var rawDevices = physicalDevices.getRaw();
                    var virtualDevices = mapping.getVirtualDevices();
                    virtualDevices.forEach(function (vDev) {
                        var info = mapping.parseVDevId(vDev.id);
                        if(!deviceIndex[info.device]){
                            var physicalDevice = physicalDevices.getDevice(rawDevices, info.device);
                            if(!physicalDevice){
                                return
                            }
                            var mappingRef = mapping.getDeviceTypeIdMappingRef(physicalDevice.info);
                            deviceIndex[info.device] = {
                                localId: mapping.getLocalDeviceId(physicalDevice.id),
                                name: physicalDevice.name,
                                deviceTypeMappingRef: mappingRef,
                                deviceTypeId: mapping.getDeviceTypeIdByMappingRef(mappingRef),
                                services:[],
                            };
                            result.push(deviceIndex[info.device]);
                        }
                        var services = mapping.getServiceDescriptions(rawDevices, vDev);
                        deviceIndex[info.device].services = deviceIndex[info.device].services.concat(services)
                    });
                    return result
                },

                getLocalPrefix: function(){
                    if(controller.uuid){
                        return controller.uuid;
                    }
                    if(!mapping.uuid){
                        try{
                            if(global.ZWave && global.ZWave[ZWAY_MODULE_NAME]){
                                mapping.uuid = JSON.parse(global.ZWave[ZWAY_MODULE_NAME].Data("").body).controller.data.uuid.value;
                            }
                        }catch (e) {
                            console.log("ERROR:", e);
                            return null
                        }
                    }
                    return mapping.uuid
                }
            };
            return mapping
        }
    };
});
