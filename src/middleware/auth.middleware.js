const jwt = require("jsonwebtoken");
const { bad } = require("../config/response.config")
require('dotenv').config();
const { emptyString } = require("../library/validation.library");
const { userModel } = require("../model/user.model");

async function authO(req, res, next) {
    try {
        const token = req.headers['x-api-key']
        // console.log('token - ', token)

        if (emptyString(token)) return bad(res, 403, false, 'Authentication Failed, x-api-key required!')

        // decode token
        jwt.verify(token, process.env.SIGNATURE, async function (err, decoded) {
            if (err) return bad(res, 403, false, 'Authentication Failed, ' + err.message + '!')
            // console.log('decode - ', decoded)
            // check from db
            const user = await userModel.findById(decoded.userId.toString())
            if (!user) return bad(res, 403, false, 'Authentication Failed, user info unavalable!')
            req.userId = decoded.userId
            req.user = user
            next()
        });
    } catch (e) {
        console.log(e.message)
        return bad(res, 403, false, 'Authentication Failed, ' + e.message + '!')
    }
}

function authZ(req, res, next) {
}


async function auth(req) {
    try {
        const token = req.headers['x-api-key']
        if (emptyString(token)) return { status: false, message: "Token Not found" }

        // decode token
        return jwt.verify(token, process.env.SIGNATURE, async (err, decoded) => {
            if (err) return { status: false, message: "Authentication Failed" }
            // console.log('decode - ', decoded)
            // check from db
            const user = await userModel.findById(decoded.userId.toString())
            if (!user) return bad(res, 403, false, 'Authentication Failed, user info unavalable!')
            return { status: true, userId: decoded.userId, user }
        });
    } catch (e) {
        console.log(e.message)
        return { status: false, message: e.message }
    }
}

module.exports = { authO, authZ, auth }