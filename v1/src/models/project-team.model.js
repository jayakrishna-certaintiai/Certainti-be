const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const TeamMember = sequelize.define('TeamMember', {
  teamMemberId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
    defaultValue: () => uuidv4().replace(/-/g, '')
  },
  projectId: {
    type: DataTypes.STRING(45),
  },
  companyId: {
    type: DataTypes.STRING(45),
  },
  contactId: {
    type: DataTypes.STRING(45),
  },
  projectRole: {
    type: DataTypes.STRING(45),
  },
  startDate: {
    type: DataTypes.DATE,
  },
  endDate: {
    type: DataTypes.DATE,
  },
  RnDExpense: {
    type: DataTypes.STRING(45),
  },
  status: {
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
  tableName: 'TeamMembers', // Replace 'your_team_member_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

// Now you can use the `TeamMember` model to interact with your database
module.exports = TeamMember;
