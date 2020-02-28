const constants = require('../config/constants');

'use strict';
module.exports = (sequelize, DataTypes) => {
    const Jam = sequelize.define('Jam', {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            isIn: [
                constants.JAM_STATUS.PENDING,
                constants.JAM_STATUS.ACTIVE,
                constants.JAM_STATUS.ENDED
            ],
            allowNull: false,
            defaultValue: constants.JAM_STATUS.PENDING,
        },
        venueLocation: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        basedOnSong: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
            get: function() {
                const st = new Date(this.getDataValue('startTime'));
                return `${st.toLocaleDateString()} ${st.toLocaleTimeString()}`;
            },
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: false,
            get: function() {
                const et = new Date(this.getDataValue('endTime'));
                return `${et.toLocaleDateString()} ${et.toLocaleTimeString()}`;
            },
        },
        performerIds: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
        },
        attendeeIds: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
        },
        requiredRoles: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
        },
        filledRoles: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
    }, {
        tableName: 'jams',
        validate: {
            validateFilledRoles: () => {
                if (this.filledRoles) {
                    for (const role of this.filledRoles) {
                        if (!constants.JAM_ROLES.includes(role.split('|')[0])) {
                            throw new Error('Invalid filled role');
                        }
                    }
                }
            },
            validateRequiredRoles: () => {
                if (this.requiredRoles) {
                    for (const role of this.requiredRoles) {
                        if (!constants.JAM_ROLES.includes(role)) {
                            throw new Error('Invalid filled role');
                        }
                    }
                }
            },
        }
    });

    Jam.associate = (models) => {
        Jam.belongsTo(models.User, {
            foreignKey: 'hostId',
            onDelete: 'CASCADE',
        });
    };

    return Jam;
}
