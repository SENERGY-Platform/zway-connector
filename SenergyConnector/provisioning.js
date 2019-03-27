executeFile("userModules/SenergyConnector/provisioning_helper.js");


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

function provisionHub(provisioningUrl, token, name, devices, idProvider){
    var id = idProvider.get();
    var hash = devicesHash(devices);
    var result = {};

    if(!id){
        result = createHub(provisioningUrl, token, name);
        if (result.err){
            return {err: result.err}
        }
        idProvider.set(result.id);
    }
    result = getHub(provisioningUrl, token, id);
    if(result.err){
        return {err: result.err}
    }
    if(result.unknown){
        result = createHub(provisioningUrl, token, name);
        if (result.err){
            return {err: result.err}
        }
        idProvider.set(result.id);
    }
    if(result.hub.hash != hash){
        var deviceResult = provisionDevices(provisioningUrl, token, devices);
        if(deviceResult.err){
            return {err: deviceResult.err}
        }
        result = updateHub(provisioningUrl, token, result.hub.id, result.hub.name, devices, hash);
        if(result.err){
            return {err: result.err}
        }
    }
    return {}
}

function createHub(token, name) {
    return undefined;
}


