const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const Alerts = sequelize.define('Alerts', {
  alertId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.STRING(45),
  },
  relatedTo: {
    type: DataTypes.STRING(45),
  },
  alertTitle: {
    type: DataTypes.STRING(128),
  },
  relationId: {
    type: DataTypes.STRING(45),
  },
  alertDesc: {
    type: DataTypes.TEXT('medium'),
  },
  status: {
    type: DataTypes.STRING(45),
  },
  statusTime: {
    type: DataTypes.DATE,
  },
  priority: {
    type: DataTypes.STRING(45),
  },
  createdBy: {
    type: DataTypes.STRING(45),
  },
  createdTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  modifiedBy: {
    type: DataTypes.STRING(45),
  },
  modifiedTime: {
    type: DataTypes.DATE,
    onUpdate: DataTypes.NOW,
    defaultValue: DataTypes.NOW,
  },
  sysModTime: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'Alerts', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

module.exports = Alerts;
