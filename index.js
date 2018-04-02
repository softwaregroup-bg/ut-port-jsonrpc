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
        let conversions = {
            send: this.config.send,
            receive: this.config.receive
        };
        this.config = merge(this.config, {
            url: global.window && global.window.location.origin,
            raw: {
                json: true,
                jar: true,
                strictSSL: false
            },
            parseResponse: false,
            requestTimeout: 300000,
            minLatency: 100,
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
                let timeout = $meta.timeout && this.timing && this.timing.diff(this.timing.now(), $meta.timeout);
                if (Number.isFinite(timeout) && timeout <= this.config.minLatency) throw this.errors.timeout();
                let $http = msg && msg.$http;
                let result = {
                    uri: ($http && $http.uri) || `/rpc/${$meta.method.replace(/\//ig, '%2F')}`,
                    url: ($http && $http.url),
                    withCredentials: ($http && $http.withCredentials),
                    httpMethod: ($http && $http.httpMethod) || 'POST',
                    headers: ($http && $http.headers),
                    requestTimeout: timeout,
                    payload: {
                        id: ($meta.mtid === 'request') ? requestId++ : null,
                        jsonrpc: '2.0',
                        method: $meta.method,
                        timeout: timeout && (timeout - this.config.minLatency),
                        params: (msg && !(msg instanceof Array) && Object.assign({}, msg)) || msg
                    }
                };
                if ($http) delete result.payload.params.$http;
                if (typeof conversions.send === 'function') {
                    return Promise.resolve().then(() => conversions.send.call(this, result, $meta));
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
