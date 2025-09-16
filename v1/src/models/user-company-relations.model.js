const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const User_Company_Relations = sequelize.define('User_Company_Relations', {
  id: {
    type: DataTypes.STRING(32),
    primaryKey: true,
    defaultValue: () => uuidv4().replace(/-/g, '')
  },
  companyId: DataTypes.STRING(32),
  userId: {
    type: DataTypes.STRING(32),
  },
  createdBy: DataTypes.STRING(32),
  createdTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  modifiedBy: DataTypes.STRING(32),
  modifiedTime: {
    type: DataTypes.DATE,
    onUpdate: DataTypes.NOW,
    defaultValue: DataTypes.NOW,
  },
  sysModTime: DataTypes.DATE
  }, {
  tableName: 'User_Company_Relations', // Replace 'your_table_name' with the actual table name
  timestamps: false
});

module.exports = User_Company_Relations;