var HttpPort = require('ut-port-http');
var util = require('util');
var errors = require('./errors');
var _ = {
    merge: require('lodash.merge')
};

function JsonRpcPort() {
    HttpPort.call(this);
    _.merge(this.config, {
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
                    if (msg.payload.id == null) {
                        $meta.mtid = 'discard';
                    }
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
                uri: (msg && msg.uri) || `/rpc/${$meta.method.replace(/\//ig, '%2F')}`,
                payload: {
                    id: ($meta.mtid === 'request') ? 1 : null,
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
    });
}

util.inherits(JsonRpcPort, HttpPort);

module.exports = JsonRpcPort;
