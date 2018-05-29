'use strict';
module.exports = (bus) => {
    let {defineError, getError, fetchErrors} = bus.errors;
    if (!getError('portJsonRPC')) {
        const RPC = defineError('portJsonRPC', null, 'JSON-RPC error', 'error');
        defineError('wrongFormat', RPC, 'Wrong JSON-RPC format', 'error');
    }
    return fetchErrors('portJsonRPC');
};
