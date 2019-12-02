
function parseMqttUrl(mqtt_url) {
    var result = {};
    var parts = mqtt_url.split("//");
    if(parts.length<2){
        return false
    }
    result.protocol = parts[0];
    parts = parts[1].split(":");
    if(parts.length<2){
        return false
    }
    result.hostname = parts[0];
    parts = parts[1].split("/");
    result.port = parseInt(parts[0]);
    return result
}
