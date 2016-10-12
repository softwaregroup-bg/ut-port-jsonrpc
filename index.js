var HttpPort = require('ut-port-http');
var util = require('util');
var errors = require('./errors');

function JsonRpcPort() {
    HttpPort.call(this);
    this.config = {
        id: 'jsonrpc',
        url: global.window && global.window.location.origin,
        raw: {
            json: true,
            jar: true,
            strictSSL: false
        },
        parseResponse: false,
        requestTimeout: 300000,
        receive: function(msg, $meta) {
            if ($meta.mtid === 'error') {
                return msg;
            }
            if (msg && msg.payload) {
                if (msg.payload.result) {
                    return msg.payload.result;
                } else if (msg.payload.error) {
                    throw errors.rpc(msg.payload.error);
                }
                throw errors.wrongJsonRpcFormat(msg);
            }
            throw errors.generic(msg);
        },
        send: function(msg, $meta) {
            var result = {
                uri: (msg && msg.uri) || `/rpc/${$meta.method}`,
                payload: {
                    id: 1,
                    jsonrpc: '2.0',
                    method: $meta.method,
                    params: msg
                }
            };
            if ($meta.method === 'identity.check' && !msg.uri) {
                result.uri = '/login';
            }
            delete msg.uri;
            return result;
        }
    };
}

util.inherits(JsonRpcPort, HttpPort);

module.exports = JsonRpcPort;
