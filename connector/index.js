/*
 *    Copyright 2018 InfAI (CC SES)
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getId(){
    var result = "";
    var object_name = "sepl_id";
    var idObject = loadObject(object_name);
    if(idObject && idObject.id){
        result = idObject.id;
    }else{
        result = uuidv4();
        saveObject(object_name, {id: result});
    }
    return result;
}

function MD5(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]| (G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};

function devicesHash(devices){
    var hashes = [];
    devices.forEach(function(element){
        hashes.push(deviceHash(element));
    });
    return arrayHash(hashes);
}

function deviceHash(device) {
    return MD5("uri:"+device.uri+",name:"+device.name+",tags:"+arrayHash(device.tags))
}

function arrayHash(arr){
    if(!arr){
        return "";
    }
    if(!arr.sort){
        return MD5(JSON.stringify(arr));
    }
    return MD5(JSON.stringify(arr.sort()));
}


function SeplConnector (id, controller) {
    SeplConnector.super_.call(this, id, controller);
}

inherits(SeplConnector, AutomationModule);
_module = SeplConnector;


SeplConnector.prototype.init = function (config) {
    console.log("Start SeplConnector with delay: ", config.startupdelay, "s");
    SeplConnector.super_.prototype.init.call(this, config);
    var self = this;

    setTimeout(function(){
        console.log("Start SeplConnector");
        executeFile("userModules/SeplConnector/protocol.js");
        executeFile("userModules/SeplConnector/connector.js");

        self.UriPrefix = getId();

        //TODO: configuratable zway name (zway == Z-Wave Network Access.config.name (internalName))
        self.zwayModuleName = "zway";

        self.client = SeplConnectorClient({
            user: config.user,
            pw: config.password,
            url: config.sepl_url,
            getHash: devicesHash,
            getGatewayId: function(){
                var result = "";
                var object_name = "sepl_gw_id";
                var idObject = loadObject(object_name);
                if(idObject && idObject.id){
                    result = idObject.id;
                }
                return result;
            },
            saveGatewayId: function(gwId){
                var object_name = "sepl_gw_id";
                saveObject(object_name, {id: gwId});
            },
            getDevices:function(){return self.getDevices()},
            onCommand: function(msg, respond){
                console.log("receive command: ", JSON.stringify(msg));
                var command = msg.service_url;
                var id = msg.device_url;
                var metrics = msg.protocol_parts && msg.protocol_parts.length == 1 && msg.protocol_parts[0] && msg.protocol_parts[0].name == "metrics" && JSON.parse(msg.protocol_parts[0].value);
                msg.protocol_parts = self.sendCommandToZway(id, command, metrics);
                respond(msg);
            },
            onStartupFinished: function(){
                if(self.startupFinished){
                    return
                }
                self.startupFinished = true;
                self.unwatchMetrics();
                self.onMetricsChange = function (vDev){
                    var deviceUri = self.getGloablDeviceUri(vDev);

                    //sepl_get_level
                    var metrics_level = JSON.stringify(self.getMetricsLevel(vDev));
                    console.log("metric level change: ", deviceUri, metrics_level);
                    var levelMsg = [{
                        name: "metrics",
                        value: metrics_level
                    }];
                    self.client.sendEvent(deviceUri, "sepl_get_level", levelMsg, null, function(err){
                        console.log("ERROR on event send: ", JSON.stringify(err))
                    });

                    //sepl_get
                    var metrics = JSON.stringify(self.getMetrics(vDev));
                    console.log("metric change: ", deviceUri, metrics);
                    var msg = [{
                        name: "metrics",
                        value: metrics
                    }];
                    self.client.sendEvent(deviceUri, "sepl_get", msg, null, function(err){
                        console.log("ERROR on event send: ", JSON.stringify(err))
                    });
                };
                self.handleDevices();
                self.watchMetrics();
            }
        });

    }, config.startupdelay*1000);

};

SeplConnector.prototype.getZwayIdMap = function(){
    if(!this.zwayIdMap){
        this.zwayIdMap = fs.loadJSON("userModules/SeplConnector/typemapping.json");
    }
    return this.zwayIdMap;
};

SeplConnector.prototype.getTags = function(){
    var self = this;
    var result = {};

    var pysicalDevices = {};
    if(global.ZWave && global.ZWave[this.zwayModuleName]){
        pysicalDevices = JSON.parse(global.ZWave[this.zwayModuleName].Data("").body).devices;
    }

    var parsePId = function(vId){
        //ZWayVDev_zway_12-0-113-7-8-A
        //ZWayVDev_[Node ID]:[Instance ID]:[Command Class ID]:[Scale ID]
        var parts = vId.split("_");
        var pId = parts[parts.length-1].split("-")[0];
        return pId
    };

    self.controller.devices.map(function (vDev) {
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
            //result[vDev.id] = ["test_tag:test"];
        }
    });
    return result
};


SeplConnector.prototype.stop = function () {
    console.log("Start SeplConnector");
    this.unwatchMetrics();
    this.client.stop();
    SeplConnector.super_.prototype.stop.call(this);
};

SeplConnector.prototype.handleDevices = function(){
    var self = this;
    var time = 10 * 1000;
    self.devicecheck = function(){
        setTimeout(function(){
            self.devicecheck();
            self.deviceChangeHandler();
        }, time)
    };
    self.devicecheck();
};

SeplConnector.prototype.watchMetrics = function(){
    var self = this;
    this.controller.devices.map(function (vDev) {
        vDev.on("change:metrics:level", self.onMetricsChange);
    });
};

SeplConnector.prototype.unwatchMetrics = function(){
    var self = this;
    this.controller.devices.map(function (vDev) {
        if(self.onMetricsChange)
            vDev.off("change:metrics:level", self.onMetricsChange);
    });
};

SeplConnector.prototype.getMetrics = function(device){
    var metrics = JSON.parse(JSON.stringify(device.get("metrics")));    //copy metrics
    metrics.updateTime = device.get("updateTime");
    if(metrics.icon){
        delete metrics.icon;
    }
    return metrics;
};

SeplConnector.prototype.getMetricsLevel = function(device){
    return {level: device.get("metrics").level, updateTime: new Date(device.get("updateTime")*1000).toISOString()};
};

SeplConnector.prototype.deviceChangeHandler = function(){
    var self = this;
    var devices = self.getDevices();
    var knownMap = self.client.getKnownDevices();
    var knownList = [];
    for (var knownUri in knownMap) {
        if (!knownMap.hasOwnProperty(knownUri)){
            continue;
        }
        knownList.push(knownMap[knownUri]);
    }
    var newHash = devicesHash(devices);
    var oldHash = devicesHash(knownList);
    if(newHash != oldHash){
        console.log("sepl: handle changed devices: ", devices.length, newHash, "!=", oldHash);
        self.unwatchMetrics();
        self.deregisterMissingDevices(devices, function(deregistered){
            self.registerDevices(devices, 0, 0, function (registered) {
                if(deregistered > 0 || registered > 0){
                    self.client.commit(devicesHash(devices), function (msg) {
                        console.log("successful commit: ", JSON.stringify(msg));
                        self.watchMetrics();
                    }, function (msg) {
                        console.log("failed commit: ", JSON.stringify(msg));
                        self.watchMetrics();
                    })
                }
            });
        });
    }
};


SeplConnector.prototype.getDevices = function(){
    var self = this;
    var tags = self.getTags();
    var zway_to_iot = self.getZwayIdMap();
    return this.controller.devices.map(function (x) {
        var uri = self.getGloablDeviceUri(x);
        return {uri: uri, iot_type: zway_to_iot[x.get("deviceType")], name: x.get("metrics").title, tags:tags[x.id]};
    });
};

function deviceChanged(oldDevice, newDevice) {
    return deviceHash(oldDevice) != deviceHash(newDevice)
}

SeplConnector.prototype.registerDevices = function(devices, index, registeredCount, then){
    var self = this;
    var known = self.client.getKnownDevices();
    if(index < devices.length){
        var device = devices[index];
        if(!known[device.uri] || deviceChanged(known[device.uri], device)){
            this.client.put(device, function(){
                self.registerDevices(devices, index+1, registeredCount+1, then);
            }, function(err){
                console.log("ERROR on device registering: ", JSON.stringify(err));
                self.registerDevices(devices, index+1, registeredCount, then);
            });
        }else{
            self.registerDevices(devices, index+1, registeredCount, then);
        }
    }else if(then){
        then(registeredCount);
    }
};

SeplConnector.prototype.deregisterDevices = function(devices, index, deregisteredCount, then){
    var self = this;
    var known = self.client.getKnownDevices();
    if(index < devices.length){
        var device = devices[index];
        if(known[device]){
            this.client.remove(device, function(){
                self.deregisterDevices(devices, index+1, deregisteredCount+1, then);
            }, function(err){
                console.log("ERROR on device deregistering: ", JSON.stringify(err));
                self.deregisterDevices(devices, index+1, deregisteredCount, then);
            });
        }else{
            self.deregisterDevices(devices, index+1, deregisteredCount, then);
        }
    }else if(then){
        then(deregisteredCount);
    }
};

SeplConnector.prototype.deregisterMissingDevices = function(devices, then){
    var self = this;
    var index = {};
    for(var i=0; i<devices.length; i++){
        index[devices[i].uri] = true;
    }
    var known = self.client.getKnownDevices();
    var missingDevices = [];
    for (var knownUri in known) {
        // skip loop if the property is from prototype
        if (!known.hasOwnProperty(knownUri)){
            continue;
        }
        if(!index[knownUri]){
            missingDevices.push(knownUri);
        }
    }
    this.deregisterDevices(missingDevices, 0, 0, then);
};


SeplConnector.prototype.sendCommandToZway = function(id, command, metrics){
    var self = this;
    var device = this.controller.devices.get(self.getLocalDeviceUri(id));
    if(device){
        if(command == "sepl_get"){
            var metrics = this.getMetrics(device);
            return [{
                name: "metrics",
                value: JSON.stringify(metrics)
            }];
        }else if (command == "sepl_get_level"){
            var metrics = this.getMetricsLevel(device);
            console.log("DEBUG", JSON.stringify(metrics));
            return [{
                name: "metrics",
                value: JSON.stringify(metrics)
            }];
        }else{
            device.performCommand(command, metrics);
        }
    }
    return null;
};


SeplConnector.prototype.getGloablDeviceUri = function(device){
    if(this.UriPrefix){
        return "ZWAY_"+this.UriPrefix+"_"+device.id;
    }
    return "ZWAY_"+device.id;
};

SeplConnector.prototype.getLocalDeviceUri = function(globalUri){
    if(this.UriPrefix){
        return globalUri.replace("ZWAY_"+this.UriPrefix+"_", "");
    }
    return globalUri.replace("ZWAY_", "");
};
