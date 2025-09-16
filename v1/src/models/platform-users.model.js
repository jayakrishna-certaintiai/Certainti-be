const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const PlatformUsers = sequelize.define('PlatformUsers', {
  userId: {
    type: DataTypes.STRING(32),
    primaryKey: true
  },
  UserType: {
    type: DataTypes.STRING(32)
  },
  sourceUserId: {
    type: DataTypes.STRING(32)
  },
  roleId: {
    type: DataTypes.STRING(45)
  },
  firstName: {
    type: DataTypes.STRING(32)
  },
  middleName: {
    type: DataTypes.STRING(32)
  },
  lastName: {
    type: DataTypes.STRING(32)
  },
  email: {
    type: DataTypes.STRING(256)
  },
  phone: {
    type: DataTypes.STRING(32)
  },
  userBaseRegion: {
    type: DataTypes.STRING(32)
  },
  userPreferedLanguage: {
    type: DataTypes.STRING(32)
  },
  userTimezone: {
    type: DataTypes.STRING(32)
  },
  status: {
    type: DataTypes.STRING(32)
  },
  statusDate: {
    type: DataTypes.DATE
  },
  isPassResetRequired: {
    type: DataTypes.BOOLEAN
  },
  roleAssignDate: {
    type: DataTypes.DATE
  },
  description: {
    type: DataTypes.TEXT,
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
  sysModTime: DataTypes.DATE,
  password: DataTypes.STRING(256),
  pin: DataTypes.STRING(256),
  MFA_ENABLED: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  isMfaRequired: {
    type: DataTypes.TINYINT(1),
    defaultValue: 0
  },
  MFA_SECRET: {
    type: DataTypes.STRING(32)
  },
  otpExpiry: {
    type: DataTypes.DATE
  },
  otp: {
    type: DataTypes.STRING(8)
  },
  cipher: {
    type: DataTypes.STRING(256),
    allowNull: true
  },
  hasPasswordChanged: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  }

}, {
  tableName: 'platformUsers',
  timestamps: false
});

module.exports = PlatformUsers