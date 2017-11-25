var HttpPort = require('ut-port-http');
var util = require('util');
var errors = require('./errors');
var _ = {
    merge: require('lodash.merge')
};

function JsonRpcPort() {
    HttpPort.call(this);
    var requestId = 1;

    this.config = _.merge(this.config, {
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
        send: function(msg = {}, $meta) {
            // msg can be both [] & {}; we destructure to extract 'control' keys
            // but can not capture ...rest as it turns the array to object
            const { uri, httpMethod, headers } = msg;
            if (msg) {
                msg.uri && delete msg.uri;
                msg.httpMethod && delete msg.httpMethod;
                msg.headers && delete msg.headers;
            }
            const result = {
                uri: uri || `/rpc/${$meta.method.replace(/\//ig, '%2F')}`,
                httpMethod: httpMethod || 'POST',
                headers: headers,
                payload: {
                    id: ($meta.mtid === 'request') ? requestId++ : null,
                    jsonrpc: '2.0',
                    method: $meta.method,
                    params: msg
                }
            };
            return result;
        }
    });
}

util.inherits(JsonRpcPort, HttpPort);

module.exports = JsonRpcPort;
