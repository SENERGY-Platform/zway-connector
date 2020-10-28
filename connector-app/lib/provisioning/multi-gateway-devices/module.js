Modules.registerModule("provisioning/multi-gateway-devices", function (module) {
    return {
        init: function () {
            var connector;
            const method = {
                set: "set",
                delete: "delete"
            }
            var result = {};
            var module_id = "";
            var lwtSent = false;

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
                console.log("get device called in multiGatewayMode: TODO"); // TODO
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
                if (module_id === "") {
                    module_id = device_id.split('-')[0]; // first part of id is module id
                }
                const msg = {
                    method: method,
                    device_id: device_id,
                    data: {
                        name: device_name,
                        state: "online",
                        device_type: device_type
                    }
                };
                if (result.sendDeviceMsg(JSON.stringify(msg)).err !== undefined) {
                    queuedMessages.push(msg);
                    console.log("WARN: multi-gateway-devices: connector not ready, message queued")
                }
            }

            result.sendDeviceMsg = function(msg) {
                if (connector && connector._connection) {
                    if (!lwtSent) {
                        result.sendLWT(); // By sending at beginning, all devices will be reset
                    }
                    return connector._connection.send("device/" + module_id, msg);
                } else {
                    return {err: "connector not ready"};
                }
            }

            result.updateConnection = function(connection) {
                connector = connection;
                lwtSent = false;
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
                connector._connection.send("device/" + module_id + "/lw", 1);
                lwtSent = true;
            }

            return result
        }
    };
});
