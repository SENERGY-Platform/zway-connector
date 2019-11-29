const ROOT = "userModules/SenergyConnector";
const ZWAY_MODULE_NAME = "zway"; //TODO: configuratable zway name (zway == Z-Wave Network Access.config.name (internalName))

var Modules = {
    _modules: {},

};

Modules.include = function(dir /*string*/) {
    try {
        executeFile(ROOT+"/lib/"+dir+"/module.js");
        return Modules.get(dir)
    }catch (e) {
        console.log("ERROR: unable to include module:", dir, JSON.stringify(e))
    }
};

Modules.registerModule = function(dir /*string*/, initFunc /*function(module)*/){
    if(!Modules._modules[dir]){
        Modules._modules[dir] = initFunc({
            add: function (filename /*string (without .js)*/) {
                try {
                    executeFile(ROOT+"/lib/"+dir+"/"+filename+".js");
                }catch (e) {
                    console.log("ERROR: unable to add file to module:", dir, filename, JSON.stringify(e))
                }
            },
            include: function(subdir /*string*/) {
                return Modules.include(dir+"/"+subdir);
            }
        });
        if(!Modules._modules[dir]){
            console.log("WARNING: null module "+dir);
            Modules._modules[dir] = {};
        }
    }
};

Modules.get = function (dir /*string*/) {
    return Modules._modules[dir];
};
