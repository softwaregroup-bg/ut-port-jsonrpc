var utError = require('ut-error');
var create = utError.define;

var RPC = create('PortRPC');
var Generic = create('Generic', RPC);
var WrongJsonRpcFormat = create('WrongJsonRpcFormat', RPC);
var plainError = cause => Object.assign(new Error(), cause);

module.exports = {
    rpc: function(cause) {
        var error = RPC;
        if (cause && cause.type) {
            error = utError.get(cause.type) || plainError;
        }
        return error(cause);
    },
    generic: function(cause) {
        return new Generic(cause);
    },
    wrongJsonRpcFormat: function(cause) {
        return new WrongJsonRpcFormat(cause);
    }
};
