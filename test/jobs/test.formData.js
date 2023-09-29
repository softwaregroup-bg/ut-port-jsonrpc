const path = require('path');
module.exports = function test() {
    return {
        formData: function(test, bus, run) {
            return run(test, bus, [
                {
                    method: 'client.request',
                    params: {
                        $http: {
                            uri: '/rpc/server/request/formData'
                        },
                        formData: {
                            pkg: require('fs').createReadStream(path.join(__dirname, '..', '..', 'package.json'))
                        }
                    },
                    result: (result, assert) => {
                        assert.match(result.pkg, {
                            name: 'ut-port-jsonrpc',
                            devDependencies: {},
                            peerDependencies: {},
                            repository: {},
                            scripts: {}
                        }, 'package.json content returned');
                    }
                }
            ]);
        }
    };
};
