const models = require('../models');
const bcrypt = require('bcryptjs');
const constants = require('../config/constants');
const { Op } = require('sequelize')

class UserService {

    /*
     * Get a list of all users objects.
     */
    findAllUsers = async () => {
        return await models.User.findAll();
    }

    /*
     * Get a single user object by its user name.
     */
    findUserByUserName = async (userName) => {
        return await models.User.findOne({
            where: { userName: userName },
        });
    }

    /*
     * Create a new user object in the db.
     */
    createNewUser = async (creationData, hashedPassword) => {
        return await models.User.create({
            userName: creationData.userName,
            bandRole: creationData.bandRole,
            password: hashedPassword,
            pasJamIds: [],
        });
    }

    /*
     * Ensure that parameter data to be used for the creation of a new user
     * object is valid. If an error is encountered, the validation function
     * simply returns a string message which is passed to the global error
     * handler in the route/controller layer.
     */
    validateCreationData = async (creationData) => {
        // Ensure all required parameters are present
        const requiredFields = ['userName', 'bandRole', 'password'];
        for (const field of requiredFields) {
            if (!Object.keys(creationData).includes(field) || !creationData[field]) {
                return `Invalid creation data - missing attribute value: "${field}"`
            }
        }

        // User names must be unique
        const existingUser = await this.findUserByUserName(creationData.userName);
        if (existingUser) {
            return 'That username is taken already';
        }

        // Chosen band roles must be reconized, valid values
        for (const role of creationData.bandRole) {
            if (!constants.JAM_ROLES.includes(role)) {
                return `Invalid band role choice: ${role}`;
            }
        }

        return false;
    }

    /*
     * Has a users password in preparation for storing in the db.
     */
    hashPassword = async (password) => {
        return await bcrypt.hash(password, constants.BCRYPT_SALT_ROUNDS);
    }

    /*
     * Once a jam has ended, the user's who attended as players will
     * have a record of their attendance saved on their user object.
     */
    updateUsersAfterJamEnd = async (jamId, userIds) => {
        // Fetch all users who played in the jam
        const usersToUpdate = await models.User.findAll({
            where: { id: { [Op.in]: userIds } },
        });

        if (usersToUpdate) {
            for (const user of usersToUpdate) {
                const updatedUserPastJamIds = user.pastJamIds || [];
                if (!updatedUserPastJamIds.includes(jamId)) {
                    // Append the jamId onto the user pastJamIds list for record keeping
                    updatedUserPastJamIds.push(jamId)

                    await user.update({
                        pastJamIds: updatedUserPastJamIds,
                    });
                }
            }
        }
    }

}

module.exports = new UserService();
