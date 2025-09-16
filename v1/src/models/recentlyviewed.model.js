const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const RecentlyViewed = sequelize.define('recentlyViewed', {
  rvid: {
    type: DataTypes.STRING(45),
    primaryKey: true,
    defaultValue: () => uuidv4().replace(/-/g, '')
  },
  viewedId: {
    type: DataTypes.STRING(255),
  },
  viewedEntity: {
    type: DataTypes.STRING(32),
  },
  viewedUITime: {
    type: DataTypes.DATE,
  },
  createdBy: {
    type: DataTypes.STRING(32),
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
  isStarred: {
    type: DataTypes.TINYINT,
    default: 0
  }
}, {
  tableName: 'recentlyViewed', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

module.exports = RecentlyViewed;
