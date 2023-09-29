module.exports = ({vfs}) => ({
    'server.request.formData'({payload: {params}}) {
        const pkg = vfs.readFileSync(params.pkg.filename);
        return {
            payload: {
                pkg: JSON.parse(pkg)
            }
        };
    }
});
