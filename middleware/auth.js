const jwt = require('jsonwebtoken')
const fs = require('fs')
const logger = require('../lib/logger')('auth.js')

module.exports = (req, res, next) => {

    logger.debug(req.path)

    try {
        var privateKey = fs.readFileSync('private.key').toString()
        var token = req.cookies['token']
        var decodedToken = jwt.verify(token, privateKey)
        var userId = decodedToken.userId
        if (req.body.userId && req.body.userId != userId) {
            return res.status(401).send({
                error: new Error('userId error')
            })
        }
        next()
    } catch (err) {
        logger.error(err)
        /*
        */
        if (req.path.endsWith('.html')) {
            res.redirect('/login.html')
        } else {
            res.status(401).send({
                error: new Error('未授权')
            })
        }
        
    }

}