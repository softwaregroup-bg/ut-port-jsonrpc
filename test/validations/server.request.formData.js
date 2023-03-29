module.exports = () => ({
    'server.request.formData': () => ({
        auth: false,
        body: {
            output: 'stream',
            parse: false,
            allow: 'multipart/form-data'
        }
    })
});
