const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const ProjectFinancialDaily = sequelize.define('ProjectFinancialDaily', {
  financeId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.STRING(45),
  },
  companyId: {
    type: DataTypes.STRING(45),
  },
  projectDate: {
    type: DataTypes.DATE,
  },
  projectRnDExpense: {
    type: DataTypes.STRING(45),
  },
  projectNonRnDExpense: {
    type: DataTypes.STRING(45),
  },
  TotalExpense: {
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
  tableName: 'projectFinancialDaily', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt columns
});

module.exports = ProjectFinancialDaily;
