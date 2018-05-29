'use strict';
module.exports = (bus) => {
    let {defineError, getError, fetchErrors} = bus.errors;
    if (!getError('portJsonRPC')) {
        const RPC = defineError('portJsonRPC');
        defineError('generic', RPC);
        defineError('wrongJsonRpcFormat', RPC);
    }
    return fetchErrors('portJsonRPC');

};
