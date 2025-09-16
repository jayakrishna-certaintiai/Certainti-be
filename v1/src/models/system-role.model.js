const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const SystemRole = sequelize.define('system_role', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    object: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    role: {
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
    tableName: 'system_role',
    timestamps: false,
});

module.exports = SystemRole;
