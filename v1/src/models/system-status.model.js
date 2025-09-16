const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const SystemStatus = sequelize.define('system_status', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    object: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    field: {
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    sequence: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    createdby: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    createdtime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    modifiedby: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    modifiedtime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    sysmodtime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'system_status',
    timestamps: false,
});

module.exports = SystemStatus;
