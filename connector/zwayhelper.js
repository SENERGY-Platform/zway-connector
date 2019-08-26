var DEVICE_GROUP_TAG_KEY = "zway_device_group";

function getZwayDevices(controller){
    var tags = getTags(controller);
    var zway_to_iot = getZwayIdMap();
    return controller.devices.map(function (x) {
        var uri = getGloablDeviceUri(x);
        var iot_type = zway_to_iot[x.get("deviceType")];
        return {uri: uri, iot_type: iot_type, name: x.get("metrics").title, tags:tags[x.id]};
    }).filter(function (e) {
        return e.iot_type
    });
}

function getTags(controller){
    //TODO: configuratable zway name (zway == Z-Wave Network Access.config.name (internalName))
    zwayModuleName = "zway";

    var result = {};

    var pysicalDevices = {};
    if(global.ZWave && global.ZWave[zwayModuleName]){
        pysicalDevices = JSON.parse(global.ZWave[zwayModuleName].Data("").body).devices;
    }

    var parsePId = function(vId){
        //ZWayVDev_zway_12-0-113-7-8-A
        //ZWayVDev_[Node ID]:[Instance ID]:[Command Class ID]:[Scale ID]
        var parts = vId.split("_");
        var pId = parts[parts.length-1].split("-")[0];
        return pId
    };

    controller.devices.map(function (vDev) {
        var pId = parsePId(vDev.id);
        var pDev = pysicalDevices[pId];
        var groupName = "";
        if(pDev){
            groupName = pDev.data.givenName.value;
        }
        if(groupName != ""){
            result[vDev.id] = [DEVICE_GROUP_TAG_KEY+":"+groupName];
        }else{
            result[vDev.id] = [];
        }
    });
    return result
}

var zwayIdMap = null;
function getZwayIdMap(){
    if(!zwayIdMap){
        zwayIdMap = fs.loadJSON("userModules/SenergyConnector/typemapping.json");
    }
    return zwayIdMap;
}

function getGloablDeviceUri(device){
    var uriPrefix = getUriPrefix();
    return "SENERGY_"+uriPrefix+"_"+device.id;
}

function getLocalDeviceUri(globalUri){
    var uriPrefix = getUriPrefix();
    return globalUri.replace("SENERGY_"+uriPrefix+"_", "");
}

var uriPrefix = null;
function getUriPrefix() {
    var object_name = "senergy_uri_prefix";
    if(!uriPrefix){
        var uriPrefixObject = loadObject(object_name);
        if(uriPrefixObject && uriPrefixObject.prefix){
            uriPrefix = uriPrefixObject.prefix;
        }else{
            uriPrefix = uuidv4();
            saveObject(object_name, {prefix: uriPrefix});
        }
    }
    return uriPrefix
}


function uuidv4() {
    return crypto.guid()
    /*
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    */
}

var hubIdProvider_id = null;
var hubIdProvider_object_name ="senergy_hub_id";
var hubIdProvider = {
    get: function () {
        if(!hubIdProvider_id){
            console.log("DEBUG: read hub id from storage");
            var idObject = loadObject(hubIdProvider_object_name);
            if(idObject && idObject.id){
                hubIdProvider_id = idObject.id;
            }else{
                console.log("DEBUG: no hub id in storage found", JSON.stringify(idObject), JSON.stringify(hubIdProvider_object_name));
                return "";
            }
        }
        return hubIdProvider_id
    },
    set: function (id) {
        console.log("save hub id in storage", id);
        hubIdProvider_id = id;
        saveObject(hubIdProvider_object_name, {id: id});
    }
};
