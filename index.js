'use strict';
const HttpPort = require('ut-port-http');
const util = require('util');
const merge = require('lodash.merge');
let errors;

module.exports = function(...params) {
    let parent = HttpPort(...params);

    function JsonRpcPort() {
        parent && parent.apply(this, arguments);
        errors = errors || require('./errors')(this.defineError, this.getError);
        let requestId = 1;

        this.config = merge(this.config, {
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
                    if (msg.payload.result !== undefined && msg.payload.error === undefined) {
                        if (msg.payload.id == null) {
                            $meta.mtid = 'discard';
                        }
                        return msg.payload.result;
                    } else if (typeof msg.payload.error === 'object') {
                        throw errors.rpc(msg.payload.error);
                    }
                    throw errors.wrongJsonRpcFormat(msg);
                }
                throw errors.generic(msg);
            },
            send: function(msg, $meta) {
                let result = {
                    uri: (msg && msg.uri) || `/rpc/${$meta.method.replace(/\//ig, '%2F')}`,
                    httpMethod: (msg && msg.httpMethod) || 'POST',
                    headers: (msg && msg.headers),
                    payload: {
                        id: ($meta.mtid === 'request') ? requestId++ : null,
                        jsonrpc: '2.0',
                        method: $meta.method,
                        params: Object.assign({}, msg)
                    }
                };
                if (msg && msg.headers) {
                    result.headers = msg.headers;
                    delete result.payload.params.headers;
                }
                if (result.payload.params && result.payload.params.uri) {
                    delete result.payload.params.uri;
                }
                if (result.payload.params && result.payload.params.httpMethod) {
                    delete result.payload.params.httpMethod;
                }
                return result;
            }
        });
    }

    if (parent) {
        util.inherits(JsonRpcPort, parent);
    }

    return JsonRpcPort;
};
