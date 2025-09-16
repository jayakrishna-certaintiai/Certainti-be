const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const TimesheetUploadLog = sequelize.define(
  "timesheetUploadLog",
  {
    timesheetIdentifier: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      get() {
        // Get function to format the companyIdentifier value as 'CO-XXXXX'
        const formattedIdentifier = 'TS-' + String(this.getDataValue('timesheetIdentifier')).padStart(7, '0');
        return formattedIdentifier;
      }
    },
    timesheetId: {
      type: DataTypes.STRING(128),
    },
    companyId: {
      type: DataTypes.STRING(45),
      allowNull: false,
      references: {
        model: "company", // Replace with the actual name of the Company model
        key: "companyId",
      },
    },
    userId: {
      type: DataTypes.STRING(45),
    },
    url: {
      type: DataTypes.STRING(255),
    },
    uploadedBy: {
      type: DataTypes.STRING(45),
    },
    month: {
      type: DataTypes.STRING(45),
    },
    year: {
      type: DataTypes.STRING(45),
    },
    uploadedOn: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updatedOn: {
      type: DataTypes.DATE,
      onUpdate: DataTypes.NOW,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.STRING(45),
    },
    originalFileName: {
      type: DataTypes.STRING(255)
    }
  },
  {
    tableName: "timesheetUploadLog",
    timestamps: false,
  }
);

module.exports = TimesheetUploadLog;