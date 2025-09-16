const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const Permissions = sequelize.define('Permissions', {
    permissionId: {
        type: DataTypes.STRING(32),
        primaryKey: true
    },
    permissionIdentifier: {
      type: DataTypes.STRING(64)
    },
    permissionName: {
        type: DataTypes.STRING(64)
    },
    status: {
        type: DataTypes.STRING(20)
    },
    statusDate: {
        type: DataTypes.DATE
    },
    createdBy: {
        type: DataTypes.STRING(32),
        allowNull: true
    },
    createdTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    modifiedTime: {
      type: DataTypes.DATE,
      onUpdate: DataTypes.NOW,
      defaultValue: DataTypes.NOW,
    },
    modifiedBy: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    sysModTime: {
      type: DataTypes.DATE,
      allowNull: true
    }
    }, {
    // Other model options go here
    tableName: 'permissions', // Specify the exact table name
    timestamps: false // Disable timestamps fields (createdAt, updatedAt)
});

module.exports = Permissions;