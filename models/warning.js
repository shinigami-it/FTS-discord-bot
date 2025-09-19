const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Warning = sequelize.define('Warning', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'warnings',
    timestamps: false,
});

module.exports = Warning;