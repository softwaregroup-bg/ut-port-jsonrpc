'use strict';
const HttpPort = require('ut-port-http');
const formData = obj => {
    const request = require('request');
    return Object.entries(obj).reduce((all, [key, value]) => {
        if (value?.$remoteStream) {
            value = request(value.$remoteStream);
        } else if (Array.isArray(value)) {
            value = value.map(v => v?.$remoteStream ? request(v.$remoteStream) : v);
        } else if (typeof value === 'object') {
            if (value.value?.$remoteStream) {
                value.value = request(value.value.$remoteStream);
            } else if (!value.value) {
                value = {
                    value: Buffer.from(JSON.stringify(value)),
                    options: {
                        filename: key + '.json',
                        contentType: 'application/json'
                    }
                };
            } else if (value.value.constructor === Object) {
                value = {
                    value: Buffer.from(JSON.stringify(value.value)),
                    options: {
                        filename: key + '.json',
                        contentType: 'application/json',
                        ...value.options
                    }
                };
            }
        }
        all[key] = value;
        return all;
    }, {});
};

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
            const formatResponse = (msg, responseHeaders) => {
                if (responseHeaders) msg.responseHeaders = responseHeaders;
                return msg;
            };
            return {
                receive: (msg, $meta) => {
                    const responseHeaders = $meta.forward?.returnResponseHeaders && $meta?.response?.headers;
                    if ($meta.mtid === 'error') {
                        if (msg && msg.body && msg.body.error && msg.body.error.type) {
                            const Error = jsonRpcPortErrors.rpc(msg.body.error);
                            Error.statusCode = msg.statusCode;
                            Error.statusText = msg.statusText;
                            Error.statusMessage = msg.statusMessage;
                            throw formatResponse(Error, responseHeaders);
                        }
                        return msg;
                    }
                    if (msg && msg.payload) {
                        if (!msg.payload.jsonrpc) {
                            return formatResponse(msg.payload, responseHeaders);
                        } else if (msg.payload.result !== undefined && msg.payload.error === undefined) {
                            if (msg.payload.id == null) {
                                $meta.mtid = 'discard';
                            }
                            if (msg.payload.$meta) {
                                const {validation, calls} = msg.payload.$meta;
                                Object.assign($meta, {validation, calls});
                            }
                            return formatResponse(msg.payload.result, responseHeaders);
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
                    const isFormData = msg && msg.formData && (
                        global.window
                            ? msg.formData instanceof window.FormData
                            : msg.formData.constructor === Object
                    );
                    if ($http.returnResponseHeaders) {
                        $meta.forward = {
                            ...$meta.forward,
                            returnResponseHeaders: $http.returnResponseHeaders
                        };
                    }
                    const result = {
                        uri: $http.uri || `/rpc/${$meta.method.replace(/\//ig, '%2F')}`,
                        url: $http.url,
                        withCredentials: $http.withCredentials,
                        httpMethod: $http.httpMethod || 'POST',
                        headers: $http.headers,
                        requestTimeout: timeout,
                        blob: $http.blob,
                        ...isFormData
                            ? global.window
                                ? {payload: msg.formData}
                                : {formData: formData(msg.formData)}
                            : {
                                payload: {
                                    jsonrpc: '2.0',
                                    method: $meta.method,
                                    timeout: timeout && (timeout - this.config.minLatency),
                                    params: (msg && !(msg instanceof Array) && Object.assign({}, msg)) || msg
                                }
                            }
                    };

                    if (!isFormData && $http.mtid !== 'notification' && $meta.mtid === 'request') {
                        result.payload.id = this.requestId++;
                    }
                    if (!isFormData && $http) delete result.payload.params.$http;
                    return result;
                }
            };
        }
    };
};
