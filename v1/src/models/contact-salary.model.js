const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const ContactSalary = sequelize.define('ContactSalary', {
  contactSalaryId: {
    type: DataTypes.STRING(45),
    primaryKey: true
  },
  contactId: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  annualRate: {
    type: DataTypes.DECIMAL(18, 2)
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(18, 2)
  },
  startDate: {
    type: DataTypes.DATE
  },
  endDate: {
    type: DataTypes.DATE
  },
  createdBy: {
    type: DataTypes.STRING(45)
  },
  createdTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  modifiedBy: {
    type: DataTypes.STRING(45)
  },
  modifiedTime: {
    type: DataTypes.DATE,
    onUpdate: DataTypes.NOW,
    defaultValue: DataTypes.NOW,
  },
  sysModTime: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'contactSalary',
  timestamps: false
});

module.exports = ContactSalary;
