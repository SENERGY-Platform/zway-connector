
function SeplConnectorProtocol(client){
    var protocol = {
        client: client,
        tokenHandler: {},
        tokenlessHandler: {}
    };

    protocol.handle = function(message){
        var msgParts = message.split(":", 2);
        var msg = msgParts[1];
        var prefix = msgParts[0].split(".",2);
        var handler = prefix[0];
        var token = prefix[1];
        if(token){
            protocol.tokenHandler[handler][token](msg)
        }
        var callbacks = protocol.tokenlessHandler[handler];
        for (index = 0; index < callbacks.length; ++index) {
            callbacks[index](msg, token)
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
            protocol.muteToken(token);
            callback(msg);
        })
    };

    protocol.listenToken = function(handler, token, callback){
        if(!protocol.tokenHandler[handler]){
            protocol.tokenHandler[handler] = {};
        }
        protocol.tokenHandler[handler][token] = callback
    };

    protocol.listen = function(handler, callback){
        if(!protocol.tokenlessHandler[handler]){
            protocol.tokenlessHandler[handler] = [];
        }
        protocol.tokenlessHandler[handler].push(callback);
    };

    protocol.muteToken = function(token){
        for (var handler in protocol.tokenHandler) {
            if (protocol.tokenHandler.hasOwnProperty(handler) && protocol.tokenHandler[handler][token]) {
                delete protocol.tokenHandler[handler][token];
            }
        }
    };

    protocol.muteHandler = function(handler, callback){
        protocol.tokenlessHandler[handler]
        var index = protocol.tokenlessHandler[handler].indexOf(callback);
        protocol.tokenlessHandler[handler].splice(index, 1);
    };

    protocol.send = function(endpoint, msg, onresponse, onerror, timeout){
        var token = protocol.createToken();
        if(onresponse){
            protocol.listenOnce("response", token, onresponse)
        }
        if(onerror){
            protocol.listenOnce("error", token, onerror)
        }
        if(timeout){
            protocol.muteToken(token);
            if(onerror){
                onerror("timout");
            }
        }
        protocol.client.ws.send(endpoint+"."+token+":"+msg)
    };

    return protocol;
}