const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const Interactions = sequelize.define('Interactions', {
  interactionID: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    defaultValue: () => uuidv4().replace(/-/g, '')
  },
  conversationId: {
    type: DataTypes.STRING(255)
  },
  companyId: {
    type: DataTypes.STRING(255)
  },
  interactionTo: {
    type: DataTypes.STRING(256)
  },
  interactionFrom: {
    type: DataTypes.STRING(256)
  },
  EmailSenderName: {
    type: DataTypes.STRING(256)
  },
  ccRecipients: {
    type: DataTypes.STRING(256)
  },
  interactionTime: {
    type: DataTypes.DATE
  },
  interactionCategory: {
    type: DataTypes.STRING(64)
  },
  interactionActivityType: {
    type: DataTypes.STRING(32)
  },
  interactionSubject: {
    type: DataTypes.STRING(256)
  },
  interactionDesc: {
    type: DataTypes.TEXT
  },
  relatedTo: {
    type: DataTypes.STRING(64)
  },
  relationId: {
    type: DataTypes.STRING(32)
  },
  status: {
    type: DataTypes.STRING(32)
  },
  statusTime: {
    type: DataTypes.DATE
  },
  createdBy: {
    type: DataTypes.STRING(32)
  },
  createdTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  modifiedBy: {
    type: DataTypes.STRING(32)
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
  EmailSent: {
    type: DataTypes.INTEGER
  },
  updatetimeStamp: {
    type: DataTypes.DATE,
    onUpdate: DataTypes.NOW
  },
  firstInteraction: {
    type: DataTypes.BOOLEAN
  }
  }, {
  tableName: 'Interactions',
  timestamps: false // Set this to true if you have timestamp fields in your table
});

module.exports = Interactions;