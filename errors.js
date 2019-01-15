'use strict';
module.exports = ({defineError, getError}) => {
    const RPC = defineError('portJsonRPC', undefined, 'JSON RPC port error');
    const Generic = defineError('generic', RPC, 'Generic JSON RPC port error');
    const plainError = cause => Object.assign(Generic(), cause);

    return {
        rpc: function(cause) {
            let error = RPC;
            if (cause && cause.type) {
                error = getError(cause.type) || plainError;
            }
            return error(cause);
        },
        generic: Generic,
        wrongJsonRpcFormat: defineError('wrongJsonRpcFormat', RPC, 'Wrong JSON RPC format')
    };
};
