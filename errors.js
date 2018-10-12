'use strict';
module.exports = (create, get) => {
    const RPC = create('portJsonRPC');
    const Generic = create('generic', RPC);
    const plainError = cause => Object.assign(new Generic(), cause);

    return {
        rpc: function(cause) {
            let error = RPC;
            if (cause && cause.type) {
                error = get(cause.type) || plainError;
            }
            return error(cause);
        },
        generic: Generic,
        wrongJsonRpcFormat: create('wrongJsonRpcFormat', RPC)
    };
};
