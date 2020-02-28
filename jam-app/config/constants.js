module.exports = {
    JAM_ROLES: [
        'LEAD VOCALS',
        'BACKUP VOCALS',
        'PERCUSSION',
        'BASS',
        'RHYTHM GUITAR',
        'LEAD GUITAR',
        'STRINGS',
        'HORNS',
        'WOODWINDS',
        'ELECTRONIC SOUNDS',
    ],

    JAM_STATUS: {
        PENDING: 'PENDING',
        ACTIVE: 'ACTIVE',
        ENDED: 'ENDED',
    },

    BCRYPT_SALT_ROUNDS: 12,

    JWT_ACCESS_TOKEN_SECRET: 'supersecret',

    JOIN_TYPES: {
        PLAYER: 'PLAYER',
        ATTENDEE: 'ATTENDEE',
    }
}
