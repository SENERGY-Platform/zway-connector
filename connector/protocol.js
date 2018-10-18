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

    protocol.handle = function(raw){
        var msg = JSON.parse(raw);
        var handler = msg.handler;
        var token = msg.token;
        if(token && protocol.tokenHandler[handler] && protocol.tokenHandler[handler][token]){
            protocol.tokenHandler[handler][token].run(msg);
        }
        var callbacks = protocol.tokenlessHandler[handler];
        if(Array.isArray(callbacks)){
            for (index = 0; index < callbacks.length; ++index) {
                callbacks[index](msg);
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

    protocol.send = function(endpoint, msg, onresponse, onerror){
        var token = protocol.createToken();
        if(!onresponse && onerror){
            onresponse = function(){};
        }
        if(onresponse && !onerror){
            onerror = function(){};
        }
        if(onresponse || onerror){
            protocol.listenOnce("response", token, function(msg){
                if(msg.status == 200 && onresponse){
                    onresponse(msg)
                }
                if(msg.status != 200 && onerror){
                    onerror(msg)
                }
            });
        }
        protocol.client.ws.send(JSON.stringify({handler: endpoint, token: token, payload: msg}))
    };

    return protocol;
};
