module.exports = () => () => ({
    test: () => [
        require('..'),
        require('../test/api'),
        require('../test/validations'),
        ...require('../test/jobs')
    ]
});
