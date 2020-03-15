'use strict';
const HttpPort = require('ut-port-http');

module.exports = function(...params) {
    let jsonRpcPortErrors;

    return class JsonRpcPort extends HttpPort(...params) {
        constructor() {
            super(...arguments);
            if (!this.errors || !this.errors.getError) throw new Error('Please use the latest version of ut-port');
            jsonRpcPortErrors = jsonRpcPortErrors || require('./errors')(this.errors);
            this.requestId = 1;
        }

        get defaults() {
            return {
                url: global.window && global.window.location.origin,
                raw: {
                    json: true,
                    jar: true,
                    strictSSL: false
                },
                parseResponse: false,
                requestTimeout: 300000,
                minLatency: 100
            };
        }

        handlers() {
            return {
                receive: (msg, $meta) => {
                    if ($meta.mtid === 'error') {
                        if (msg && msg.body && msg.body.error && msg.body.error.type) throw jsonRpcPortErrors.rpc(msg.body.error);
                        return msg;
                    }
                    if (msg && msg.payload) {
                        if (msg.payload.result !== undefined && msg.payload.error === undefined) {
                            if (msg.payload.id == null) {
                                $meta.mtid = 'discard';
                            }
                            return msg.payload.result;
                        } else if (typeof msg.payload.error === 'object') {
                            throw jsonRpcPortErrors.rpc(msg.payload.error);
                        }
                        throw jsonRpcPortErrors.wrongJsonRpcFormat(msg);
                    }
                    throw jsonRpcPortErrors.generic(msg);
                },
                send: (msg, $meta) => {
                    const timeout = $meta.timeout && this.timing && Math.floor(this.timing.diff(this.timing.now(), $meta.timeout));
                    if (Number.isFinite(timeout) && timeout <= this.config.minLatency) throw this.errors.timeout();
                    const $http = (msg && msg.$http) || {};
                    const result = {
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
                        result.payload.id = this.requestId++;
                    }
                    if ($http) delete result.payload.params.$http;
                    return result;
                }
            };
        }
    };
};
