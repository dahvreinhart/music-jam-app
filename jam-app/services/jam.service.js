const models = require('../models');
const constants = require('../config/constants');
const UserService = require('../services/user.service');

class JamService {

    /*
     * Get a list of all pending jam objects.
     */
    findPendingJams = async () => {
        return await models.Jam.findAll({
            include: [
                { model: models.User },
            ],
            where: {
                status: constants.JAM_STATUS.PENDING,
            },
            order: [
                ['startTime', 'ASC'],
            ]
        });
    }

    /*
     * Get a list of all active jam objects.
     */
    findActiveJams = async () => {
        return await models.Jam.findAll({
            include: [
                { model: models.User },
            ],
            where: {
                status: constants.JAM_STATUS.ACTIVE,
            },
            order: [
                ['endTime', 'ASC'],
            ]
        });
    }

    /*
     * Get a list of all ended/past jam objects.
     */
    findPastJams = async () => {
        return await models.Jam.findAll({
            include: [
                { model: models.User },
            ],
            where: {
                status: constants.JAM_STATUS.ENDED,
            },
            order: [
                ['endTime', 'DESC'],
            ]
        });
    }

    /*
     * Get a single jam object by its database ID.
     */
    findSingleJamById = async (id) => {
        return await models.Jam.findOne({
            include: [
                { model: models.User }
            ],
            where: { id: id },
        });
    }

    /*
     * Create a new jam object in the db.
     */
    createNewJam = async (creationData, hostId) => {
        return await models.Jam.create({
            title: creationData.title,
            status: constants.JAM_STATUS.PENDING,
            venueLocation: creationData.venueLocation,
            basedOnSong: creationData.basedOnSong,
            startTime: new Date(creationData.startTime),
            endTime: new Date(creationData.endTime),
            requiredRoles: creationData.requiredRoles,
            filledRoles: [],
            performerIds: [],
            attendeeIds: [],
            hostId: hostId,
        });
    }

    /*
     * Ensure that parameters to be used for the creation of a new jam
     * object are valid. If an error is encountered, the validation function
     * simply returns a string message which is passed to the global error
     * handler in the route/controller layer.
     */
    validateCreationData = async (creationData, hostId) => {
        // Ensure all required fields are present
        const requiredFields = ['title', 'venueLocation', 'basedOnSong', 'startTime', 'endTime', 'requiredRoles'];
        for (const field of requiredFields) {
            if (!Object.keys(creationData).includes(field) || !creationData[field]) {
                return `Invalid creation data - missing attribute value: "${field}"`
            }
        }

        // Ensure proper timing parameters
        try {
            const st = new Date(creationData.startTime);
            const et = new Date(creationData.endTime);

            if (st < new Date()) {
                return 'Start time must be in the future'
            }

            if (st > et) {
                return 'Start time must be before end time'
            }
        } catch (error) {
            return 'Invalid start time or end time format'
        }

        // The chosen required roles should all be valid, recognized values
        for (const role of creationData.requiredRoles) {
            if (!constants.JAM_ROLES.includes(role)) {
                return `Invalid role choice: ${role}`;
            }
        }

        // If there is already a jam with the same venue location happening
        // at the same time, then that is no good.
        const duplicate = await models.Jam.findOne({
            where: {
                venueLocation: creationData.venueLocation,
                startTime: creationData.startTime,
            }
        })
        if (duplicate) {
            return 'There is already a jam at the specified venue at the specified time';
        }

        // Make sure host is not double booking themselves
        const otherHostedJams = await models.Jam.findAll({
            where: { hostId: hostId }
        });
        const newStartTime = new Date(creationData.startTime);
        for (const jam of otherHostedJams) {
            if (newStartTime > new Date(jam.startTime) && newStartTime < new Date(jam.endTime)) {
                return 'Invalid jam start time - you already have a jam booked for this time';
            }
        }

        return false;
    }

    /*
     * Fetch a list of which roles a particular user is eligable to fill
     * on a particular jam.
     */
    getPossibleRoles = async (jam, userId) => {
        const user = await models.User.findOne({
            where: { id: userId }
        });

        const possibleRoles = [];
        if (user) {
            for (const role of user.bandRole) {
                if (jam.requiredRoles.includes(role) && !jam.filledRoles.map(fr => fr.split('|')[0]).includes(role)) {
                    possibleRoles.push(role);
                }
            }
        }

        return possibleRoles;
    }

    /*
     * Ensure paramters to be used for a join request are valid.
     * If an error is encountered, the validation function
     * simply returns a string message which is passed to the global error
     * handler in the route/controller layer. This validation function
     * covers join request from attendees as well as from players.
     */
    validateJoinRequest = async (joinType, jamId, userId, chosenRole) => {
        if (!joinType || !jamId) return 'Invalid join parameters';

        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const user = await models.User.findOne({ where: { id: userId } });

        if (!jam) return 'Could not find jam to join';
        if (!user) return 'Could not find user for join request';

        if (user.id === jam.hostId) return 'The host cannot join the jam';

        // If this is a player joining, ensure their role choice is valid
        if (joinType === constants.JOIN_TYPES.PLAYER) {
            const possibleRoles = await this.getPossibleRoles(jam, user.id);
            if (typeof chosenRole !== 'string') return 'Invalid role choice format';
            if (!possibleRoles.includes(chosenRole)) return 'Invalid role choice';
        }

        // Only pending jams may be joined
        if (jam.status !== constants.JAM_STATUS.PENDING) {
            return 'Unable to join the jam as the starting time has already past';
        }

        return false;
    }

    /*
     * Mark a user as having joined a particular jam.
     */
    joinJam = async (joinType, jamId, userId, chosenRole) => {
        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const user = await models.User.findOne({ where: { id: userId } });

        let updatedJam;
        if (joinType === constants.JOIN_TYPES.PLAYER) {
            // Put the user on the jams performer list
            const updatedPerformerList = jam.performerIds;
            updatedPerformerList.push(user.id);

            // Mark the role that was fulled by this user
            const updatedFilledRoles = jam.filledRoles;
            updatedFilledRoles.push(`${chosenRole}|${user.id}`);

            updatedJam = await jam.update({
                performerIds: updatedPerformerList,
                filledRoles: updatedFilledRoles,
            });
        } else if (joinType === constants.JOIN_TYPES.ATTENDEE) {
            // Put the user on the jams attendee list
            const updatedAttendeeList = jam.attendeeIds;
            updatedAttendeeList.push(user.id);

            updatedJam = await jam.update({
                attendeeIds: updatedAttendeeList,
            });
        }

        return updatedJam;
    }

    /*
     * Ensure that parameters to be used for the leaving of a jam are valid.
     * If an error is encountered, the validation function
     * simply returns a string message which is passed to the global error
     * handler in the route/controller layer. This validation function
     * covers leave request from attendees as well as from players.
     */
    validateLeaveRequest = async (jamId, userId) => {
        if (!jamId)  return 'Invalid leave parameters';

        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const user = await models.User.findOne({ where: { id: userId } });

        if (!jam)  return 'Could not find jam';
        if (!user)  return 'Could not find user';

        // Once a jam has started, the attendance roster is locked
        if (jam.status !== constants.JAM_STATUS.PENDING) {
            return 'Unable to leave the jam as the starting time has already past';
        }

        return false;
    }

    /*
     * Remove a user from a particular jam. This is essentially the
     * opposite of joining a jam.
     */
    leaveJam = async (jamId, userId) => {
        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const user = await models.User.findOne({ where: { id: userId } });

        let updatedJam;
        if (jam.attendeeIds.includes(user.id)) {
            // If this user was an attendee then remove them from the attendees list
            const updatedAttendeeList = jam.attendeeIds;
            updatedAttendeeList.splice(updatedAttendeeList.indexOf(user.id), 1)

            updatedJam = await jam.update({
                attendeeIds: updatedAttendeeList,
            });
        } else if (jam.performerIds.includes(user.id)) {
            // If this user was a player, then remove them from the player list
            const updatedPerformerList = jam.performerIds;
            updatedPerformerList.splice(updatedPerformerList.indexOf(user.id), 1);

            // Also, mark the role they were previously filling as vacant again
            const updatedFilledRoles = jam.filledRoles;
            updatedFilledRoles.splice(updatedFilledRoles.map(fr => fr.split('|')[1]).indexOf(user.id), 1);

            updatedJam = await jam.update({
                performerIds: updatedPerformerList,
                filledRoles: updatedFilledRoles,
            });
        }

        return updatedJam;
    }

    /*
     * Ensure that parameters to be used to start a jam are valid.
     * If an error is encountered, the validation function
     * simply returns a string message which is passed to the global error
     * handler in the route/controller layer.
     */
    validateStartRequest = async (jamId, userId) => {
        if (!jamId)  return 'Invalid start parameters';

        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const user = await models.User.findOne({ where: { id: userId } });

        if (!jam)  return 'Could not find jam';
        if (!user)  return 'Could not find user';

        // Only pending jams may be started
        if (jam.status !== constants.JAM_STATUS.PENDING) {
            return 'Unable to start jam because it is not pending';
        }

        // Only the host of the jam may execute this action
        if (jam.hostId !== user.id) {
            return 'Unable to start jam - only the host may start the jam';
        }

        // A jam can only be started when all required roles have been filled
        if (jam.requiredRoles.length !== jam.filledRoles.length) {
            return 'Unable to start jam because not all required roles are filled';
        }
    }

    /*
     * Mark a jam object as having been started. Despite a start time
     * being defined on the jam at object creation, the start time
     * is updated here to be when the start action was executed.
     */
    startJam = async (jamId) => {
        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const now = new Date();

        const updatedJam = await jam.update({
            status: constants.JAM_STATUS.ACTIVE,
            startTime: now,
        });

        return updatedJam;
    }

    /*
     * Ensure parameters to be used to end a jam are valid.
     * If an error is encountered, the validation function
     * simply returns a string message which is passed to the global error
     * handler in the route/controller layer.
     */
    validateEndRequest = async (jamId, userId) => {
        if (!jamId)  return 'Invalid end parameters';

        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const user = await models.User.findOne({ where: { id: userId } });

        if (!jam)  return 'Could not find jam';
        if (!user)  return 'Could not find user';

        // Only active jams may be ended
        if (jam.status !== constants.JAM_STATUS.ACTIVE) {
            return 'Unable to end jam because it has not been started yet';
        }

        // Only the host of this jam may end it
        if (jam.hostId !== user.id) {
            return 'Unable to end jam - only the host may end the jam';
        }
    }

    /*
     * Mark a jam as having ended. Despite a end time
     * being defined on the jam at object creation, the end time
     * is updated here to be when the end action was executed. This
     * also leads to the users who played in the jam having a record
     * of their attendance saved to the user objects for record keeping.
     */
    endJam = async (jamId) => {
        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const now = new Date();

        const updatedJam = await jam.update({
            status: constants.JAM_STATUS.ENDED,
            endTime: now,
        });

        // Update player users to have a record of this jam
        await UserService.updateUsersAfterJamEnd(jam.id, jam.performerIds);

        return updatedJam;
    }

    /*
     * Ensure parameters to be used for the deletion of a jam are valid.
     * If an error is encountered, the validation function
     * simply returns a string message which is passed to the global error
     * handler in the route/controller layer.
     */
    validateDeletionRequest = async (jamId, userId) => {
        if (!jamId)  return 'Invalid deletion parameters';

        const jam = await models.Jam.findOne({ where: { id: jamId } });
        const user = await models.User.findOne({ where: { id: userId } });

        if (!jam)  return 'Could not find jam';
        if (!user)  return 'Could not find user';

        // Only pending jams may be deleted
        if (jam.status !== constants.JAM_STATUS.PENDING) {
            return 'Unable to delete jam because it has already started';
        }

        // Only the host of a jam may delete it
        if (jam.hostId !== user.id) {
            return 'Unable to delete jam - only the host may delete the jam';
        }
    }

    /*
     * Remove the specified jam object fromt he database.
     */
    deleteJam = async (jamId) => {
        return await models.Jam.destroy({
            where: { id: jamId },
        });
    }

}

module.exports = new JamService();
