'use strict';
const HttpPort = require('ut-port-http');
const util = require('util');
const errorsFactory = require('./errors');

module.exports = function(...params) {
    let parent = HttpPort(...params);

    function JsonRpcPort() {
        parent && parent.apply(this, arguments);
        Object.assign(this.errors, errorsFactory(this.bus));
        let requestId = 1;

        this.config = this.merge(this.config, {
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
                        if (msg.payload.error.type) {
                            let localError = this.getError(msg.payload.error.type);
                            if (localError) {
                                throw localError(msg.payload.error);
                            }
                            throw Object.assign(this.errors.portJsonRPC(), msg.payload.error);
                        }
                        throw this.errors.portJsonRPC(msg.payload.error);
                    }
                    throw this.errors['portJsonRPC.wrongFormat'](msg);
                }
                throw this.errors.portJsonRPC(msg);
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
                return result;
            }
        });
    }

    if (parent) {
        util.inherits(JsonRpcPort, parent);
    }

    return JsonRpcPort;
};
