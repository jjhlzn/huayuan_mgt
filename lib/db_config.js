module.exports = {
    user: 'business',
    password: 'hengdianworldbusiness',
    server: '10.1.87.210',
    port: 1433,
    database: 'HDBusiness',
    encrypt: false,
    enableArithAbort: true,
    requestTimeout: 300000,
    options: {
        cryptoCredentialsDetails: {
            minVersion: 'TLSv1'
        }
    }
}
