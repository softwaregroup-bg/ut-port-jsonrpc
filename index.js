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
        if (msg && msg.payload && msg.payload.result) {
            return msg.payload.result;
        } else if (msg && msg.payload && msg.payload.error) {
            return Promise.reject(errors.generic(msg.payload.error));
        } else {
            return Promise.reject(errors.generic(msg));
        }
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
        if ($meta.method === 'identity.check' && !result.uri) {
            result.uri = '/login';
        }
        return result;
    }
};
