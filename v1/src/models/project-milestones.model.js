const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const ProjectMilestones = sequelize.define('ProjectMilestones', {
  milestoneId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
    defaultValue: () => uuidv4(),
  },
  projectId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },
  milestoneName: {
    type: DataTypes.STRING(100),
  },
  startDate: {
    type: DataTypes.DATE,
  },
  endDate: {
    type: DataTypes.DATE,
  },
  createdBy: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  createdTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
    defaultValue: DataTypes.NOW
  },
}, {
  tableName: 'projectMilestones', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt columns
});

module.exports = ProjectMilestones;
