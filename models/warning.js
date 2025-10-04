const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Warning = sequelize.define('Warning', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    moderatorId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    deactivationReason: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'warnings',
    timestamps: false,
});

module.exports = Warning;