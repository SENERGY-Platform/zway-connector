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
                console.log("create device called in multiGatewayMode: TODO"); // TODO
                return {device: {name: name}}
            };

            result.updateDevice = function(token, remoteId, localId, name, deviceTypeId){
                result.setDevice(method.set, localId, name, deviceTypeId)
                console.log("update device called in multiGatewayMode: TODO"); // TODO
                return {device: {name: name}}
            };

            result.deleteDevice = function(token, localId){
                result.setDevice(method.delete, localId, name, deviceTypeId)
                console.log("delete device called in multiGatewayMode: TODO"); // TODO
            };

            result.getDevice = function(token, localId){
                console.log("get device called in multiGatewayMode: TODO"); // TODO
                return {unknown: true}
            };


            result.createHub = function(token, name, localDeviceIds, hash) {
                console.log("create hub called in multiGatewayMode: TODO"); // TODO
                return {hub: {hash: 0}}
            };

            result.updateHub = function(token, id, name, localDeviceIds, hash) {
                console.log("update hub called in multiGatewayMode: TODO"); // TODO
                return {hub: {hash: 0}}
            };

            result.getHub = function(token, id) {
                console.log("get hub called in multiGatewayMode: TODO"); // TODO
                return {hub: {hash: 0}}
            };

            result.setDevice = function(method, device_id, device_name, device_type) {
                if (module_id === "") {
                    module_id = device_id.split('-')[0]; // first part of id is module id
                }
                if (!lwtSent) {
                    result.sendLWT(); // By sending at beginning, all devices will be reset
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
                result.sendDeviceMsg(JSON.stringify(msg));
            }

            result.sendDeviceMsg = function(msg) {
                if (connector && connector._connection) {
                    return connector._connection.send("device/" + module_id, msg);
                } else {
                    queuedMessages.push(msg);
                    console.log("WARN: multi-gateway-devices: connector not ready, message queued")
                    return {err: "connector not ready"}
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
