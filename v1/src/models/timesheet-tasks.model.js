const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const TimesheetTasks = sequelize.define('TimesheetTasks', {
  taskId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },
  timesheetId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },
  teamMemberId: {
    type: DataTypes.STRING(45),
  },
  taskDate: {
    type: DataTypes.DATE,
  },
  taskDescription: {
    type: DataTypes.STRING(45),
  },
  projectId: {
    type: DataTypes.STRING(45),
  },
  taskClassification: {
    type: DataTypes.STRING(45),
  },
  taskHourlyRate: {
    type: DataTypes.STRING(45),
  },
  taskEffort: {
    type: DataTypes.DOUBLE,
  },
  taskTotalExpense: {
    type: DataTypes.STRING(45),
  },
  RnDExpense: {
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
  tableName: 'TimesheetTasks', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt columns
});

module.exports = TimesheetTasks;
