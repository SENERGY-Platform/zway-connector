Modules.registerModule("hubid", function (module) {
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
    return hubIdProvider
});
