const express = require('express');
const router = express.Router();
const UserService = require('../services/user.service');
const AuthService = require('../services/auth.service');
const { authMiddleware } = require('../middleware/auth.middleware');

/*
 * Get a list of all users. This is a non-linked-to page meant to be
 * used for verification purposes and not for the normal functionality
 * of the application.
 */
router.get('/', authMiddleware, async function (req, res, next) {
    const users = await UserService.findAllUsers();
    res.render('listUsers', {
        title: 'All Users',
        userItems: users,
        loggedInUserName: req.user.userName,
    });
});

/*
 * Create a new user. Once the user ha sbeen created, they are automatically
 * authenticated before getting sent to the default post-auth page which is
 * the pending jams list.
 */
router.post('/', async function (req, res, next) {
    const creationData = req.body;
    if (creationData.bandRole && typeof creationData.bandRole === 'string') {
        creationData.bandRole = [creationData.bandRole];
    }

    // Validate the creation data
    const validationError = await UserService.validateCreationData(creationData);
    if (validationError) return next(new Error(validationError))

    // Hash the user's password before storing it in the db
    const hashedPassword = await UserService.hashPassword(creationData.password);

    // Create the new user object
    const newUser = await UserService.createNewUser(creationData, hashedPassword);

    // Auto-authenticate the new user
    const accessToken = AuthService.generateJWTAccessToken(newUser);

    res.cookie('accessToken', accessToken, { maxAge: 86400000 });
    res.redirect(`/jams/pending`);
});

/*
 * Serve the signup page. This page is only available to unauthenticated
 * users. Thus, if an authenticated user hits this page they simply get
 * redirected to the default post-auth page which is the pending jams list.
 */
router.get('/signup', async function (req, res, next) {
    try {
        const user = AuthService.verifyJWTAccessToken(req.cookies.accessToken);
        if (user) res.redirect('/jams/pending');
    } catch (error) {
        res.render('signup', {
            title: 'Sign Up',
        });
    }
});

/*
 * Authenticate a particular user. Authentication is handled using
 * json web tokens which have a lifetime of 1 day. The resulting
 * access token is then stored in a cookie for the user to use in
 * the future. The cookie also has a 1 day lifespan.
 */
router.post('/login', async function (req, res, next) {
    const { userName, password } = req.body;

    const user = await UserService.findUserByUserName(userName);

    if (user) {
        if (!(await AuthService.comparePasswords(password, user.password))) {
            return next(new Error('Invalid login credentials'))
        }

        const accessToken = AuthService.generateJWTAccessToken(user);
        res.cookie('accessToken', accessToken, { maxAge: 86400000 });
        res.redirect('/jams/pending');
    } else {
        return next(new Error('Invalid login credentials'))
    }
});

/*
 * Log a particular user out of the application. This means simply destory
 * their authentication cookie and route them to the default pre-auth homepage.
 */
router.get('/logout', authMiddleware, async function (req, res, next) {
    res.clearCookie('accessToken');
    res.redirect('/');
});

module.exports = router;
