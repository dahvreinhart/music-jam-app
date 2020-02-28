const jwt = require('jsonwebtoken');
const constants = require('../config/constants');
const bcrypt = require('bcryptjs');

class AuthService {

    /*
     * Generate a new jwt access token based on
     * personal user information.
     */
    generateJWTAccessToken = (user) => {
        return jwt.sign(
            {
                id: user.id,
                userName: user.userName,

            },
            constants.JWT_ACCESS_TOKEN_SECRET,
            { expiresIn: '1d' },
        );
    }

    /*
     * Ensure that an incoming jwt is valid.
     */
    verifyJWTAccessToken = (token) => {
        return jwt.verify(
            token,
            constants.JWT_ACCESS_TOKEN_SECRET
        );
    }

    /*
     * Ensure that two passwords are cryptographically identical.
     */
    comparePasswords = async (pw1, pw2) => {
        return await bcrypt.compare(pw1, pw2);
    }

}

module.exports = new AuthService();
