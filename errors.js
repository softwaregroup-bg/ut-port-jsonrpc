'use strict';
const utError = require('ut-error');
const create = utError.define;

const RPC = create('portJsonRPC');
const Generic = create('generic', RPC);
const plainError = cause => Object.assign(new Generic(), cause);

module.exports = {
    rpc: function(cause) {
        let error = RPC;
        if (cause && cause.type) {
            error = utError.get(cause.type) || plainError;
        }
        return error(cause);
    },
    generic: Generic,
    wrongJsonRpcFormat: create('wrongJsonRpcFormat', RPC)
};
