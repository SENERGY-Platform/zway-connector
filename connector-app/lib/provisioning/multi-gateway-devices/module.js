Modules.registerModule("provisioning/multi-gateway-devices", function (module) {
    return {
        init: function () {
            var connector;
            const method = {
                set: "set",
                delete: "delete"
            }
            var result = {};
            const controllerId = global.ZWave && global.ZWave[ZWAY_MODULE_NAME] ? JSON.parse(global.ZWave[ZWAY_MODULE_NAME].Data("").body).controller.data.uuid.value : "unknown-zway";

            var queuedMessages = [];

            result.login = function(user, password) {
                return {token: null}
            };

            result.createDevice = function(token, localId, name, deviceTypeId){
                result.setDevice(method.set, localId, name, deviceTypeId)
                return {device: {name: name}}
            };

            result.updateDevice = function(token, remoteId, localId, name, deviceTypeId){
                result.setDevice(method.set, localId, name, deviceTypeId)
                return {device: {name: name}}
            };

            result.deleteDevice = function(token, localId){
                result.setDevice(method.delete, localId, name, deviceTypeId)
            };

            result.getDevice = function(token, localId){
                return {unknown: true}
            };


            result.createHub = function(token, name, localDeviceIds, hash) {
                return {hub: {hash: 0}}
            };

            result.updateHub = function(token, id, name, localDeviceIds, hash) {
                return {hub: {hash: 0}}
            };

            result.getHub = function(token, id) {
                return {hub: {hash: 0}}
            };

            result.setDevice = function(method, device_id, device_name, device_type) {
                var msg = {
                    method: method,
                    device_id: device_id,
                    data: {
                        name: device_name,
                        state: "online",
                        device_type: device_type
                    }
                };
                msg = JSON.stringify(msg);
                if (result.sendDeviceMsg(msg).err !== undefined) {
                    if (queuedMessages.indexOf(msg) === -1) {
                        queuedMessages.push(msg);
                        console.log("WARN: multi-gateway-devices: connector not ready, message queued");
                    } else {
                        console.log("DEBUG: multi-gateway-devices: connector not ready, same message already queued, not queueing again");
                    }
                }
            }

            result.sendDeviceMsg = function(msg) {
                if (connector && connector._connection) {
                    return connector._connection.send("device/" + controllerId, msg);
                } else {
                    return {err: "connector not ready"};
                }
            }

            result.updateConnection = function(connection) {
                connector = connection;
                result.sendLWT();
                console.log("DEBUG: Multi-gateway-devices Queue length: ", queuedMessages.length)
                if (queuedMessages.length > 0) {
                    console.log("INFO: multi-gateway-devices: sending queued messages");
                    for (var i = 0; i < queuedMessages.length; i++) {
                        if (result.sendDeviceMsg(queuedMessages[0]).err === undefined) {
                            queuedMessages.shift();
                        } else {
                            console.log("WARN: multi-gateway-devices: connector still not ready, message requeued. No further attempts until new connection");
                            break;
                        }
                    }
                    console.log("DEBUG: Multi-gateway-devices Queue length: ", queuedMessages.length)
                }
            }

            result.sendLWT = function () {
                connector._connection.send("device/" + controllerId + "/lw", "1");
            }

            return result
        }
    };
});
