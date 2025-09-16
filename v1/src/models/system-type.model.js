const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const SystemType = sequelize.define('system_type', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    object: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING(32),
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
    tableName: 'system_type',
    timestamps: false,
});

module.exports = SystemType;
