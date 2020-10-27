Modules.registerModule("provisioning/platform-devices", function (module) {
    const LocalRequestErrorType = "local request error";

    return {
        init: function (deviceManagerUrl, authUrl, client_id) {
            var result = {};

            result.login = function(user, password) {
                if(encodeURIComponent){
                    user = encodeURIComponent(user);
                    password = encodeURIComponent(password)
                }else{
                    console.log("WARNING: missing encodeURIComponent()")
                }
                var resp = http.request({
                    url:authUrl+"/auth/realms/master/protocol/openid-connect/token",
                    method:"POST",
                    headers:{"Content-Type":"application/x-www-form-urlencoded"},
                    data: "client_id="+client_id+"&username="+user+"&password="+password+"&grant_type=password"
                });
                if(resp.status == -1){
                    return {err: {text: "unable to connect to "+authUrl+"/auth/realms/master/protocol/openid-connect/token"}}
                }
                if(resp.status >= 300){
                    return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
                }
                if(resp.status == -1){
                    return {err: {text: "unable to run http request", type: LocalRequestErrorType, resp: resp}}
                }
                if(!resp.data || !resp.data.access_token){
                    return {err: {text: "empty access_token in response", status: resp.status, data: resp.data}}
                }
                return {token: "Bearer " +resp.data.access_token}
            };

            result.createDevice = function(token, localId, name, deviceTypeId){
                var resp = http.request({
                    url:deviceManagerUrl+"/local-devices",
                    method:"POST",
                    headers:{"Content-Type":"application/json", "Authorization":token},
                    data: JSON.stringify({name: name, device_type_id:deviceTypeId, local_id: localId})
                });
                if(resp.status == -1){
                    return {err: {text: "unable to connect to "+deviceManagerUrl+"/local-devices/"+encodeURIComponent(localId)}}
                }
                if(resp.status >= 300){
                    return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
                }
                return {device: resp.data}
            };

            result.updateDevice = function(token, remoteId, localId, name, deviceTypeId){
                var resp = http.request({
                    url:deviceManagerUrl+"/local-devices/"+encodeURIComponent(localId),
                    method:"PUT",
                    headers:{"Content-Type":"application/json", "Authorization":token},
                    data: JSON.stringify({id: remoteId, name: name, device_type_id:deviceTypeId, local_id: localId})
                });
                if(resp.status == -1){
                    return {err: {text: "unable to connect to "+deviceManagerUrl+"/local-devices/"+encodeURIComponent(localId)}}
                }
                if(resp.status >= 300){
                    return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
                }
                return {device: resp.data}
            };

            result.deleteDevice = function(token, localId){
                var resp = http.request({
                    url:deviceManagerUrl+"/local-devices/"+encodeURIComponent(localId),
                    method:"DELETE",
                    headers:{"Content-Type":"application/json", "Authorization":token},
                });
                if(resp.status == -1){
                    return {err: {text: "unable to connect to "+deviceManagerUrl+"/local-devices/"+encodeURIComponent(localId)}}
                }
                if(resp.status >= 300){
                    return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
                }
                return {}
            };

            result.getDevice = function(token, localId){
                var resp = http.request({
                    url:deviceManagerUrl+"/local-devices/"+encodeURIComponent(localId),
                    method:"GET",
                    headers:{"Content-Type":"application/json", "Authorization":token},
                });
                if(resp.status == -1){
                    return {err: {text: "unable to connect to "+deviceManagerUrl+"/local-devices/"+encodeURIComponent(localId)}}
                }
                if(resp.status == 404){
                    return {unknown: true}
                }
                if(resp.status == 403){
                    return {access_denied: true}
                }
                if(resp.status == 401){
                    return {access_denied: true}
                }
                if(resp.status >= 300){
                    return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
                }
                if(!resp.data.id){
                    return {err: {text: "unable to interpret GET /hubs/{id} response (missing id)", status: resp.status, data: resp.data}}
                }
                return {device: resp.data}
            };


            result.createHub = function(token, name, localDeviceIds, hash) {
                var resp = http.request({
                    url:deviceManagerUrl+"/hubs",
                    method:"POST",
                    headers:{"Content-Type":"application/json", "Authorization":token},
                    data: JSON.stringify({name: name, hash: hash, device_local_ids: localDeviceIds})
                });
                if(resp.status == -1){
                    return {err: {text: "unable to connect to "+deviceManagerUrl+"/hubs/"+encodeURIComponent(id)}}
                }
                if(resp.status >= 300){
                    return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
                }
                if(!resp.data.id){
                    return {err: {text: "unable to interpret POST /hubs response (missing id)", status: resp.status, data: resp.data, content_type: resp.contentType, headers: resp.headers}}
                }
                return {hub: resp.data}
            };

            result.updateHub = function(token, id, name, localDeviceIds, hash) {
                var resp = http.request({
                    url:deviceManagerUrl+"/hubs/"+encodeURIComponent(id),
                    method:"PUT",
                    headers:{"Content-Type":"application/json", "Authorization":token},
                    data: JSON.stringify({id: id, name: name, hash: hash, device_local_ids: localDeviceIds})
                });
                if(resp.status == -1){
                    return {err: {text: "unable to connect to "+deviceManagerUrl+"/hubs/"+encodeURIComponent(id)}}
                }
                if(resp.status >= 300){
                    return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
                }
                if(!resp.data.id){
                    return {err: {text: "unable to interpret POST /hubs response (missing id)", status: resp.status, data: resp.data, content_type: resp.contentType, headers: resp.headers}}
                }
                return {hub: resp.data}
            };

            result.getHub = function(token, id) {
                var resp = http.request({
                    url:deviceManagerUrl+"/hubs/"+encodeURIComponent(id),
                    method:"GET",
                    headers:{"Content-Type":"application/json", "Authorization":token}
                });
                if(resp.status == -1){
                    return {err: {text: "unable to connect to "+deviceManagerUrl+"/hubs/"+encodeURIComponent(id)}}
                }
                if(resp.status == 404){
                    return {unknown: true}
                }
                if(resp.status == 403){
                    return {access_denied: true}
                }
                if(resp.status == 401){
                    return {access_denied: true}
                }
                if(resp.status >= 300){
                    return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
                }
                if(!resp.data.id){
                    return {err: {text: "unable to interpret GET /hubs/{id} response (missing id)", status: resp.status, data: resp.data}}
                }
                return {hub: resp.data}
            };

            result.updateConnection = function(connection) {
                // NOP
            }

            return result
        }
    };
});
