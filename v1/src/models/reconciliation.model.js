const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const Reconciliations = sequelize.define('Reconciliations', {
    reconciliationIdentifier: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      get() {
        // Get function to format the companyIdentifier value as 'CO-XXXXX'
        const formattedIdentifier = 'WB-' + String(this.getDataValue('reconciliationIdentifier')).padStart(7, '0');
        return formattedIdentifier;
      }
    },
    reconcileId: {
      type: DataTypes.STRING(45),
    },
    reconcileStatus: {
      type: DataTypes.STRING(45)
    },
    reconcileRevision: {
      type: DataTypes.INTEGER
    },
    reconcileSummary: {
      type: DataTypes.TEXT('tiny')
    },
    reconcileRnDHoursOverride: {
      type: DataTypes.DECIMAL(10, 2)
    },
    reconcileNonRnDHoursOverride: {
      type: DataTypes.DECIMAL(10, 2)
    },
    reconcileTaskOverrideDesc: {
      type: DataTypes.TEXT('tiny')
    },
    timesheetId: {
      type: DataTypes.STRING(45)
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
    },
    projectId: {
      type: DataTypes.STRING(45)
    }
    }, {
    tableName: 'Reconciliations', // Replace with your table name
    timestamps: false,
    // Other model options go here
});
  
module.exports = Reconciliations;