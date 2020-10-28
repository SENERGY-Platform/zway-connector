Modules.registerModule("provisioning/multi-gateway-devices", function (module) {
    return {
        init: function (multiGatewayDeviceManagement) {
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
                if (!multiGatewayDeviceManagement || multiGatewayDeviceManagement === "") {
                    console.log("WARN: Multi Gateway Mode enabled, but no Device Management URL defined");
                    return {unknown: true};
                }
                const localDeviceRequest =  http.request({
                    url: multiGatewayDeviceManagement + '/devices/' + localId
                });

                if(localDeviceRequest.status === 404){
                    return {unknown: true};
                }

                if(localDeviceRequest.status !== 200){
                    if(localDeviceRequest.status !== 404){
                        console.log("ERROR: could not get device from multi gateway device management", localDeviceRequest.status);
                    }
                    return {unknown: true};
                }

                const localDevice = localDeviceRequest.data;
                return {device: {id: "", name: localDevice.name, device_type_id: localDevice.device_type}}; // transform model
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
                    queuedMessages.push(msg);
                    console.log("WARN: multi-gateway-devices: connector not ready, message queued")
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
                if (queuedMessages.length > 0) {
                    console.log("INFO: multi-gateway-devices: sending queued messages");
                    for (var i = queuedMessages.length - 1; i >= 0; i--) {
                        if (result.sendDeviceMsg(queuedMessages[i]).err === undefined) {
                            queuedMessages.splice(i, 1);
                        } else {
                            console.log("WARN: multi-gateway-devices: connector still not ready, message requeued")
                        }
                    }
                }
            }

            result.sendLWT = function () {
                connector._connection.send("device/" + controllerId + "/lw", "1");
            }

            return result
        }
    };
});
