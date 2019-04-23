if(!devicesHash){
    executeFile("userModules/SenergyConnector/hash.js");
}

function Reg() {
    this._devices = [];
    this._hash = null;
}

Reg.prototype.set = function (devices, hash) {
    this._hash = hash;
    this._devices = devices;
};

Reg.prototype.devices = function () {
    return this._devices;
};

Reg.prototype.hash = function () {
    return this._hash;
};

Reg.prototype.resetHash = function () {
    this._hash = null;
};

Reg.prototype.diff = function(devices){
    var hash = devicesHash(devices);
    if(hash == this.hash()){
        return null;
    }
    var old = this.devices();

    var indexNew = {};
    for(var i=0; i<devices.length; i++){
        indexNew[devices[i].uri] = devices[i];
    }

    var indexOld = {};
    for(var i=0; i<old.length; i++){
        indexOld[old[i].uri] = old[i];
    }

    var removed = [];
    for (var uri in indexOld) {
        // skip loop if the property is from prototype
        if (!indexOld.hasOwnProperty(uri)){
            continue;
        }
        if(!indexNew[uri]){
            removed.push(indexOld[uri]);
        }
    }

    var added = [];
    for (var uri in indexNew) {
        // skip loop if the property is from prototype
        if (!indexNew.hasOwnProperty(uri)){
            continue;
        }
        if(!indexOld[uri]){
            added.push(indexNew[uri]);
        }
    }
    return {added: added, removed: removed, newHash: hash, oldHash: this.hash()};
};
