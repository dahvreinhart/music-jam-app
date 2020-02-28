const express = require('express');
const router = express.Router();
const JamService = require('../services/jam.service');
const { authMiddleware } = require('../middleware/auth.middleware');

/*
 * Show a list of pending jams that have not started yet.
 */
router.get('/pending', authMiddleware, async function (req, res, next) {
    const pendingJams = await JamService.findPendingJams();

    res.render('listJams', {
        title: 'Pending Jams',
        jamItems: pendingJams,
        loggedInUserName: req.user.userName,
    });
});

/*
 * Show a list of active jams that have started but have not ended yet.
 */
router.get('/active', authMiddleware, async function (req, res, next) {
    const activeJams = await JamService.findActiveJams();

    res.render('listJams', {
        title: 'Active Jams',
        jamItems: activeJams,
        loggedInUserName: req.user.userName,
    });
});

/*
 * Show a list of past jams that have already ended.
 */
router.get('/past', authMiddleware, async function (req, res, next) {
    const pastJams = await JamService.findPastJams();

    res.render('listJams', {
        title: 'Past Jams',
        jamItems: pastJams,
        loggedInUserName: req.user.userName,
    });
});

/*
 * Serve the new jam creation page.
 */
router.get('/create', authMiddleware, async function (req, res, next) {
    res.render('newJamCreationForm', {
        title: 'Create a New Jam',
        loggedInUserName: req.user.userName,
    });
});

/*
 * Create a new jam. Incoming params are validated prior to new object creation.
 */
router.post('/', authMiddleware, async function (req, res, next) {
    const creationData = req.body;
    if (creationData.requiredRoles && typeof creationData.requiredRoles === 'string') {
        creationData.requiredRoles = [creationData.requiredRoles];
    }

    // Validate creation params
    const validationError = await JamService.validateCreationData(creationData, req.user.id);
    if (validationError) return next(new Error(validationError))

    // Create new object
    const newJam = await JamService.createNewJam(creationData, req.user.id);

    res.redirect(`/jams/${newJam.id}/detail`);
});

/*
 * Serve the detail page for a specific jam. The various options displayed
 * on the detail page are controlled via variables injected here.
 */
router.get('/:jamId/detail', authMiddleware, async function (req, res, next) {
    const jam = await JamService.findSingleJamById(req.params.jamId);

    if (!jam) return next(new Error('Could not find this Jam!'));

    // Define option variables to inject into the template
    const isHost = req.user.id === jam.hostId;
    const hasJoinedAsPlayer = jam.performerIds.includes(req.user.id);
    const hasJoinedAsAttendee = jam.attendeeIds.includes(req.user.id);
    const possibleRoles = await JamService.getPossibleRoles(jam, req.user.id);
    const canJoinAsPlayer = !isHost && possibleRoles.length;

    res.render('jamDetails', {
        title: `Jam Details for ${jam.title}`,
        jamItem: jam,
        isHost: isHost,
        canJoinAsPlayer: canJoinAsPlayer,
        possibleRoles: possibleRoles,
        hasJoinedAsPlayer: hasJoinedAsPlayer,
        hasJoinedAsAttendee: hasJoinedAsAttendee,
        loggedInUserName: req.user.userName,
    });
});

/*
 * Join a particular jam. This endpoint is hit by both those looking to join
 * as a player and those looking to join as an attendee.
 */
router.post('/:jamId/join', authMiddleware, async function (req, res, next) {
    const jamId = req.params.jamId;
    const joinType = req.query.joinType;
    const { chosenRole } = req.body;
    const userId = req.user.id;

    // Validate this join request
    const validationError = await JamService.validateJoinRequest(joinType, jamId, userId, chosenRole)
    if (validationError) return next(new Error(validationError))

    // Add the user to apropriate jam list and update the jam
    await JamService.joinJam(joinType, jamId, userId, chosenRole);

    res.redirect(`/jams/${jamId}/detail`);
});

/*
 * Leave a particular jam if the user was previously joined.
 */
router.post('/:jamId/leave', authMiddleware, async function (req, res, next) {
    const jamId = req.params.jamId;
    const userId = req.user.id;

    // Validate this leave request
    const validationError = await JamService.validateLeaveRequest(jamId, userId)
    if (validationError) return next(new Error(validationError))

    // Remove the user from the appropriate jam list and update the jam
    await JamService.leaveJam(jamId, userId);

    res.redirect(`/jams/${jamId}/detail`);
});

/*
 * Start a particular jam. This endpoint is only to be hit by the host of the
 * jam being started. Once a jam is started, the player roster is locked. It
 * will also disappear from the pending jam list and appear in the active jam
 * list.
 */
router.post('/:jamId/start', authMiddleware, async function (req, res, next) {
    const jamId = req.params.jamId;
    const userId = req.user.id;

    // Validate this start request
    const validationError = await JamService.validateStartRequest(jamId, userId)
    if (validationError) return next(new Error(validationError))

    // Update the jam status to active
    await JamService.startJam(jamId);

    res.redirect(`/jams/${jamId}/detail`);
});

/*
 * End a particular jam. This endpoint is only to be hit by te host of the jam
 * being ended. Once a jam is ended, it will disappear from the active jam list
 * and appear in the past/ended jam list. Once a jam has ended, the record of
 * having played in that jam is added to all user objects that played in the jam.
 */
router.post('/:jamId/end', authMiddleware, async function (req, res, next) {
    const jamId = req.params.jamId;
    const userId = req.user.id;

    // Validate this end request
    const validationError = await JamService.validateEndRequest(jamId, userId)
    if (validationError) return next(new Error(validationError))

    // Update the jam status to ended
    await JamService.endJam(jamId);

    res.redirect(`/jams/${jamId}/detail`);
});

/*
 * Delete a particular jam. This endpoint is only to be hit by the host of the
 * jam being deleted. Only pending jams can be deleted.
 */
router.post('/:jamId/delete', authMiddleware, async function (req, res, next) {
    const jamId = req.params.jamId;
    const userId = req.user.id;

    // Validate this deletion request
    const validationError = await JamService.validateDeletionRequest(jamId, userId)
    if (validationError) return next(new Error(validationError))

    // Delete the jam object
    await JamService.deleteJam(jamId);

    res.redirect('/jams/pending');
});

module.exports = router;
