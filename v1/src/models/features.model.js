const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const Features = sequelize.define('Features', {
  featureId: {
    type: DataTypes.STRING(32),
    primaryKey: true,
    defaultValue: () => uuidv4().replace(/-/g, '')
  },
  featureIdentifier: {
    type: DataTypes.STRING(128)
  },
  featureTitle: {
    type: DataTypes.STRING(128)
  },
  description: {
    type: DataTypes.TEXT
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
  tableName: 'Features', // Specify the exact table name
  timestamps: false // Disable timestamps fields (createdAt, updatedAt)
});

module.exports = Features;