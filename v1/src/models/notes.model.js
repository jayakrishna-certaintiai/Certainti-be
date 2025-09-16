const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const Notes = sequelize.define('Notes', {
  notesId: {
    type: DataTypes.STRING(45),
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.STRING(45),
  },
  relatedTo: {
    type: DataTypes.STRING(45),
  },
  relationId: {
    type: DataTypes.STRING(45),
  },
  notes: {
    type: DataTypes.TEXT,
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
  tableName: 'Notes', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

module.exports = Notes;
