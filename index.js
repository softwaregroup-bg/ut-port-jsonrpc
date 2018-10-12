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
                let timeout = $meta.timeout && this.timing && Math.floor(this.timing.diff(this.timing.now(), $meta.timeout));
                if (Number.isFinite(timeout) && timeout <= this.config.minLatency) throw this.errors.timeout();
                let $http = (msg && msg.$http) || {};
                let result = {
                    uri: $http.uri || `/rpc/${$meta.method.replace(/\//ig, '%2F')}`,
                    url: $http.url,
                    withCredentials: $http.withCredentials,
                    httpMethod: $http.httpMethod || 'POST',
                    headers: $http.headers,
                    requestTimeout: timeout,
                    blob: $http.blob,
                    payload: {
                        jsonrpc: '2.0',
                        method: $meta.method,
                        timeout: timeout && (timeout - this.config.minLatency),
                        params: (msg && !(msg instanceof Array) && Object.assign({}, msg)) || msg
                    }
                };

                if ($http.mtid !== 'notification' && $meta.mtid === 'request') {
                    result.payload.id = requestId++;
                }
                if ($http) delete result.payload.params.$http;
                return result;
            }
        });
    }

    if (parent) {
        util.inherits(JsonRpcPort, parent);
    }

    return JsonRpcPort;
};
