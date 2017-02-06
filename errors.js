var create = require('ut-error').define;

var Generic = create('PortRPC');
var WrongJsonRpcFormat = create('WrongJsonRpcFormat', Generic);

module.exports = {
    generic: function(cause) {
        return new Generic(cause);
    },
    wrongJsonRpcFormat: function(cause) {
        return new WrongJsonRpcFormat(cause);
    }
};
