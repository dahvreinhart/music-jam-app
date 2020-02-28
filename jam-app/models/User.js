const constants = require('../config/constants');

'use strict';
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        userName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        bandRole: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
        },
        pastJamIds: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
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
        tableName: 'appusers',
        validate: {
            validateBandRole: () => {
                if (this.bandRole) {
                    for (const role of this.bandRole) {
                        if (!constants.JAM_ROLES.includes(role)) {
                            throw new Error('Invalid band role');
                        }
                    }
                }
            }
        }
    });

    User.associate = (models) => {
        User.hasMany(models.Jam, {
            foreignKey: 'hostId',
            as: 'hostedJams',
        });
    };

    return User;

}
