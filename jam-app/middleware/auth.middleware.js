const AuthService = require('../services/auth.service');

module.exports = {
    /*
     * Authentication middleware to handle json web token
     * verifiction on protected routes.
     */
    authMiddleware: async (req, res, next) => {
        const accessToken = req.cookies.accessToken;

        // See if the incoming token is valid - if not, route to homepage
        if (accessToken) {
            try{
                const user = AuthService.verifyJWTAccessToken(accessToken)
                req.user = user;
                next();
            } catch (error) {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
    }
}
