Modules.registerModule("provisioning/multi-gateway-devices", function (module) {
    return {
        init: function (connector) {
            const method = {
                set: "set",
                delete: "delete"
            }
            var result = {};

            result.login = function(user, password) {
                return {token: null}
            };

            result.createDevice = function(token, localId, name, deviceTypeId){
                result.setDevice(method.set, localId, name, deviceTypeId)
                console.log("create device called in multiGatewayMode: TODO"); // TODO
            };

            result.updateDevice = function(token, remoteId, localId, name, deviceTypeId){
                result.setDevice(method.set, localId, name, deviceTypeId)
                console.log("update device called in multiGatewayMode: TODO"); // TODO
            };

            result.deleteDevice = function(token, localId){
                result.setDevice(method.delete, localId, name, deviceTypeId)
                console.log("delete device called in multiGatewayMode: TODO"); // TODO
            };

            result.getDevice = function(token, localId){
                console.log("get device called in multiGatewayMode: TODO"); // TODO
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
                const msg = {
                    method: method,
                    device_id: device_id,
                    data: {
                        name: device_name,
                        state: "online",
                        device_type: device_type
                    }
                };
                connector._connection.send("device/zway", msg); // TODO
            }


            return result
        }
    };
});
