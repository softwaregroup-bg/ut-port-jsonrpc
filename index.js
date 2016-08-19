var errors = require('./errors');
module.exports = {
    id: 'jsonrpc',
    createPort: require('ut-port-http'),
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
                throw msg.payload.error;
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
        return result;
    }
};
