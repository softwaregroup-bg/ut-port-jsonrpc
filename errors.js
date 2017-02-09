var utError = require('ut-error');
var create = utError.define;

var RPC = create('PortRPC');
var Generic = create('Generic', RPC);
var WrongJsonRpcFormat = create('WrongJsonRpcFormat', RPC);

module.exports = {
    rpc: function(cause) {
        return cause && cause.type && utError.get(cause.type)(cause) || new RPC(cause);
    },
    generic: function(cause) {
        return new Generic(cause);
    },
    wrongJsonRpcFormat: function(cause) {
        return new WrongJsonRpcFormat(cause);
    }
};
