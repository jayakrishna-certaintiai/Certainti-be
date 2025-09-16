const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const RecentlyViewed = sequelize.define('recentlyViewed', {
    viewedId: {
        type: DataTypes.STRING(45),
        primaryKey: true
    },
    viewedEntity: {
        type: DataTypes.ENUM('client', 'contact', 'portfolio', 'projects', 'workflow', 'report', 'activity', 'timesheet', 'workbench', 'documents', 'alerts'), // Add your enum values here
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING(32),
        allowNull: false
    },
    viewedUITime: {
        type: DataTypes.DATE,
        allowNull: false
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
    tableName: 'recentlyViewed', // Specify the exact table name
    timestamps: false // Disable timestamps fields (createdAt, updatedAt)
});

module.exports = RecentlyViewed;