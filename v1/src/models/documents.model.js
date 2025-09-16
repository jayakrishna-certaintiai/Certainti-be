const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');

const Documents = sequelize.define('Documents', {
  documentId: {
    type: DataTypes.STRING(32),
    primaryKey: true,
    defaultValue: () => uuidv4().replace(/-/g, '')
  },
  companyId: {
    type: DataTypes.STRING(32),
    primaryKey: true,
  },
  relatedTo: {
    type: DataTypes.STRING(64),
  },
  relationId: {
    type: DataTypes.STRING(32),
  },
  documentName: {
    type: DataTypes.STRING(256),
  },
  documentPath: {
    type: DataTypes.STRING(256),
  },
  documentSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  documentType: {
    type: DataTypes.STRING(32),
  },
  createdBy: {
    type: DataTypes.STRING(32),
  },
  createdTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  modifiedBy: {
    type: DataTypes.STRING(32),
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
  RnDScope: {
    type: DataTypes.STRING(25)
  },
  aistatus: {
    type: DataTypes.STRING(16),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(255),
    defaultValue: 'Pending'
  },
  projectId: {
    type: DataTypes.STRING(36)
  },
  originalFileName: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'Documents',
  timestamps: false,
});

module.exports = Documents;