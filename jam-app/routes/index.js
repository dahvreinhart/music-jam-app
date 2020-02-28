const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth.service');

/*
 * Serve the homepage. The homepage, since it contains login/signup
 * functionality, is onyl available to unathenticated users. If the
 * current user is authenticated, they will be routed to the default
 * after-auth page which is the pending jam list.
 */
router.get('/', function (req, res, next) {
    try {
        const user = AuthService.verifyJWTAccessToken(req.cookies.accessToken);
        if (user) res.redirect('/jams/pending');
    } catch (error) {
        res.render('index', {
            title: 'Welcome to Jam Finder!',
        });
    }
});

module.exports = router;
