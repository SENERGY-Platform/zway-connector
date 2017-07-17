var SeplConnectorProtocol = function(client){
    var protocol = {
        client: client,
        tokenHandler: {},
        tokenlessHandler: {}
    };

    var splitN = function(text, seperator, n){
        var result = [];
        var components = text.split(seperator);
        for(i = 0; i<n-1 && components.length > 1; i++){
            result.push(components.shift());
        }
        result.push(components.join(seperator));
        return result;
    };

    protocol.handle = function(message){
        var msgParts = splitN(message, ":", 2);
        var msg = msgParts[1];
        var prefix = splitN(msgParts[0], ".", 2);
        var handler = prefix[0];
        var token = prefix[1];
        //console.log("debug: handle: ", JSON.stringify([handler, token, msg]));
        if(token && protocol.tokenHandler[handler] && protocol.tokenHandler[handler][token]){
            //console.log("debug: found and run handler");
            protocol.tokenHandler[handler][token].run(msg);
        }
        var callbacks = protocol.tokenlessHandler[handler];
        if(Array.isArray(callbacks)){
            for (index = 0; index < callbacks.length; ++index) {
                callbacks[index](msg, token);
            }
        }
    };

    protocol.createToken = function(){
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };

    protocol.listenOnce = function(handler, token, callback){
        protocol.listenToken(handler, token, function(msg){
            //console.log("debug: listenOnce handler run");
            protocol.muteToken(token);
            callback(msg);
        })
    };

    protocol.listenToken = function(handler, token, callback){
        if(!protocol.tokenHandler[handler]){
            protocol.tokenHandler[handler] = {};
        }
        protocol.tokenHandler[handler][token] = {run: callback}
    };

    protocol.listen = function(handler, callback){
        if(!protocol.tokenlessHandler[handler]){
            protocol.tokenlessHandler[handler] = [];
        }
        protocol.tokenlessHandler[handler].push(callback);
    };

    protocol.muteToken = function(token){
        //console.log("debug: mute token ", token, JSON.stringify(protocol.tokenHandler));
        for (var handler in protocol.tokenHandler) {
            if (protocol.tokenHandler.hasOwnProperty(handler) && protocol.tokenHandler[handler][token]) {
                protocol.tokenHandler[handler][token] = null;
                delete protocol.tokenHandler[handler][token];
            }
        }
    };

    protocol.muteHandler = function(handler, callback){
        var index = protocol.tokenlessHandler[handler].indexOf(callback);
        protocol.tokenlessHandler[handler].splice(index, 1);
    };

    protocol.send = function(endpoint, msg, onresponse, onerror, timeout){
        var token = protocol.createToken();
        if(!onresponse && timeout && onerror){
            onresponse = function(){};
        }
        if(onresponse){
            protocol.listenOnce("response", token, onresponse)
        }
        if(onerror){
            protocol.listenOnce("error", token, onerror)
        }
        if(timeout && onerror){
            setTimeout(function () {
                //console.log("debug: timout tokenhandler ", token, JSON.stringify(protocol.tokenHandler));
                if(protocol.tokenHandler["error"][token]){
                    protocol.muteToken(token);
                    if(onerror){
                        onerror("timout");
                    }
                }
            }, timeout);
        }
        protocol.client.ws.send(endpoint+"."+token+":"+msg)
    };

    return protocol;
};
