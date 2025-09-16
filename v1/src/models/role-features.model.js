const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const RoleFeatures = sequelize.define('RoleFeatures', {
    roleFeaturesId: {
        type: DataTypes.STRING(32),
        primaryKey: true,
        defaultValue: () => uuidv4().replace(/-/g, '')
    },
    roleId: {
        type: DataTypes.STRING(32)
    },
    featureId: {
        type: DataTypes.STRING(32)
    },
    permissionId: {
        type: DataTypes.STRING(32)
    },
    status: {
        type: DataTypes.BOOLEAN
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
      allowNull: true,
      defaultValue: DataTypes.NOW,
    }
    }, {
    // Other model options go here
    tableName: 'RoleFeatures', // Specify the exact table name
    timestamps: false // Disable timestamps fields (createdAt, updatedAt)
});

module.exports = RoleFeatures;