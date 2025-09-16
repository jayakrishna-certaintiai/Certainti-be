const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const Roles = sequelize.define('Roles', {
  roleId: {
    type: DataTypes.STRING(32),
    primaryKey: true,
    defaultValue: () => uuidv4().replace(/-/g, '')
  },
  role: {
    type: DataTypes.STRING(45)
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
  tableName: 'Roles', // Specify the exact table name
  timestamps: false // Disable timestamps fields (createdAt, updatedAt)
});

module.exports = Roles;