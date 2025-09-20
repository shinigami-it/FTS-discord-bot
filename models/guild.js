const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');
console.log(Guild); // sollte ein Sequelize Model zeigen
console.log(typeof Guild.findOne);
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
}, {
    tableName: 'guild',
    timestamps: false,
});

module.exports = Guild;
