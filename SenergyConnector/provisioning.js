executeFile("userModules/SenergyConnector/provisioning_helper.js");

const waiting_time = 3000;

function login(authUrl, client_id, user, password) {
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
    if(resp.status >= 300){
        return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
    }
    if(!resp.data.access_token){
        return {err: {text: "empty access_token in response", status: resp.status, data: resp.data}}
    }
    return {token: "Bearer " +resp.data.access_token}
}

//the sepl/senergy platform works with eventual consistency -> wie cant operate with a device or hub immediately after its creation -> wait if something has been created
//if a device has been added to hub, it may take some time until the first data transfer is successful
function provisionHub(provisioningUrl, token, name, devices, idProvider, then){
    var id = idProvider.get();
    var hash = devicesHash(devices);
    var result = {};
    var timeout = 0;

    if(!id){
        result = createHub(provisioningUrl, token, name);
        if (result.err){
            then({err: result.err});
            return
        }
        timeout = waiting_time;
        idProvider.set(result.hub.id);
    }else{
        result = getHub(provisioningUrl, token, id);
        if(result.err){
            then({err: result.err});
            return
        }
        if(result.unknown){
            result = createHub(provisioningUrl, token, name);
            if (result.err){
                then({err: result.err});
                return
            }
            timeout = waiting_time;
            idProvider.set(result.hub.id);
        }
    }
    if(result.hub.hash != hash){
        var deviceResult = provisionDevices(provisioningUrl, token, devices);
        if(deviceResult.err){
            then({err: deviceResult.err});
            return
        }
        if(deviceResult.created){
            timeout = waiting_time;
        }
        //the sepl/senergy platform works with eventual consistency -> wie cant operate with a device or hub immediately after its creation -> wait if something has been created
        //if a device has been added to hub, it may take some time until the first data transfer is successful
        var hub = result.hub;
        setTimeout(function () {
            var result = updateHub(provisioningUrl, token, hub.id, hub.name, devices, hash);
            if(result.err){
                then({err: result.err});
                return
            }
            then({hub: result.hub});
        }, timeout);
    }else{
        then({hub:result.hub});
    }
}

function createHub(provisioningUrl, token, name) {
    var resp = http.request({
        url:provisioningUrl+"/hubs",
        method:"POST",
        headers:{"Content-Type":"application/json", "Authorization":token},
        data: JSON.stringify({name: name})
    });
    if(resp.status >= 300){
        return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
    }
    if(!resp.data.id){
        return {err: {text: "unable to interpret POST /hubs response (missing id)", status: resp.status, data: resp.data, content_type: resp.contentType, headers: resp.headers}}
    }
    return {hub: resp.data}
}

function getHub(provisioningUrl, token, id) {
    if(encodeURIComponent){
        id = encodeURIComponent(id);
    }else{
        console.log("WARNING: missing encodeURIComponent()")
    }
    var resp = http.request({
        url:provisioningUrl+"/hubs/"+id,
        method:"GET",
        headers:{"Content-Type":"application/json", "Authorization":token}
    });
    if(resp.status == 404){
        return {unknown: true}
    }
    if(resp.status == 401){
        return {unknown: true}
    }
    if(resp.status >= 300){
        return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
    }
    if(!resp.data.id){
        return {err: {text: "unable to interpret GET /hubs/{id} response (missing id)", status: resp.status, data: resp.data}}
    }
    return {hub: resp.data}
}

function updateHub(provisioningUrl, token, id, name, devices, hash) {
    var encodedId = id;
    if(encodeURIComponent){
        encodedId = encodeURIComponent(encodedId);
    }else{
        console.log("WARNING: missing encodeURIComponent()")
    }
    var deviceUris = [];
    devices.forEach(function(element){
        deviceUris.push(element.uri);
    });
    var resp = http.request({
        url:provisioningUrl+"/hubs/"+encodedId,
        method:"PUT",
        headers:{"Content-Type":"application/json", "Authorization":token},
        data: JSON.stringify({id: id, name: name, hash: hash, devices: deviceUris})
    });
    if(resp.status >= 300){
        return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
    }
    if(!resp.data.id){
        return {err: {text: "unable to interpret PUT /hubs/{id} response (missing id)", status: resp.status, data: resp.data}}
    }
    return {hub: resp.data}
}

function provisionDevices(provisioningUrl, token, devices) {
    var created = false;
    for(i = 0; i < devices.length; i++){
        var device = devices[i];
        var deviceResult = provisionDevice(provisioningUrl, token, device);
        if(deviceResult.err){
            return {err: deviceResult.err}
        }
        if(deviceResult.created){
            created = true;
        }
    }
    if(created){
        return {created: true}
    }
    return {ok: true};
}

function provisionDevice(provisioningUrl, token, device) {
    var exists = checkDeviceExistense(provisioningUrl, token, device);
    if(exists.err){
        return {err: exists.err}
    }
    if(exists.exists){
        return updateDevice(provisioningUrl, token, device)
    }else{
        return createDevice(provisioningUrl, token, device)
    }
}

function checkDeviceExistense(provisioningUrl, token, device) {
    // device: {uri: uri, iot_type: zway_to_iot[x.get("deviceType")], name: x.get("metrics").title, tags:tags[x.id]}
    var uri = device.uri;
    if(encodeURIComponent){
        uri = encodeURIComponent(uri);
    }else{
        console.log("WARNING: missing encodeURIComponent()")
    }
    var resp = http.request({
        url:provisioningUrl+"/device-uris/"+uri,
        method:"HEAD",
        headers:{"Authorization":token},
    });
    if(resp.status == 404){
        return {exists: false}
    }
    if(resp.status == 200){
        return {exists: true}
    }
    if(resp.status >= 300){
        return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
    }
    console.log("WARNING: checkDeviceExistense(); unexpected response status <300; !=200; !=404", resp.status);
    return {exists: true}
}

function updateDevice(provisioningUrl, token, device) {
    // device: {uri: uri, iot_type: zway_to_iot[x.get("deviceType")], name: x.get("metrics").title, tags:tags[x.id]}
    var uri = device.uri;
    if(encodeURIComponent){
        uri = encodeURIComponent(uri);
    }else{
        console.log("WARNING: missing encodeURIComponent()")
    }
    var resp = http.request({
        url:provisioningUrl+"/device-uris/"+uri,
        method:"PUT",
        headers:{"Content-Type":"application/json", "Authorization":token},
        data: JSON.stringify({name: device.name, device_type:device.iot_type, uri: device.uri, tags:device.tags})
    });
    if(resp.status >= 300){
        return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
    }
    return {updated: true}
}

function createDevice(provisioningUrl, token, device) {
    if(!device.iot_type){
        return {err: "missing device type id"}
    }
    var resp = http.request({
        url:provisioningUrl+"/device-uris",
        method:"POST",
        headers:{"Content-Type":"application/json", "Authorization":token},
        data: JSON.stringify({name: device.name, device_type:device.iot_type, uri: device.uri, tags:device.tags})
    });
    if(resp.status >= 300){
        return {err: {text: "unexpected response", status: resp.status, data: resp.data}}
    }
    return {created: true}
}

