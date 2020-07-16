'use strict';
module.exports = ({defineError, getError}) => {
    const RPC = defineError('portJsonRPC', undefined, 'JSON RPC port error');
    const Generic = defineError('generic', RPC, 'Generic JSON RPC port error');

    return {
        rpc: cause => Object.assign(Generic(), cause),
        generic: Generic,
        wrongJsonRpcFormat: defineError('wrongJsonRpcFormat', RPC, 'Wrong JSON RPC format')
    };
};
