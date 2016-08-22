var create = require('ut-error').define;

var RPC = create('PortRPC');
var Generic = create('Generic', RPC);
var WrongJsonRpcFormat = create('WrongJsonRpcFormat', RPC);

module.exports = {
    rpc: function(cause) {
        return new RPC(cause);
    },
    generic: function(cause) {
        return new Generic(cause);
    },
    wrongJsonRpcFormat: function(cause) {
        return new WrongJsonRpcFormat(cause);
    }
};
