const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Guild = sequelize.define('Guild', {
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    prefix: {
        type: DataTypes.STRING,
        defaultValue: '!',
    },
    welcomeChannelId: {
        type: DataTypes.STRING,
        defaultValue: null,
    },
    welcomeRoleId: {
        type: DataTypes.STRING,
        defaultValue: null,
    },
    rulesId: {
        type: DataTypes.STRING,
        defaultValue: null,
    },
    memberCountChannelId: {
        type: DataTypes.STRING,
        defaultValue: null,
    },
    feedbackChannelId: {
        type: DataTypes.STRING,
        defaultValue: null,
    },
    eggResponsesEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    cheapResponsesEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'guild',
    timestamps: false,
});

module.exports = Guild;