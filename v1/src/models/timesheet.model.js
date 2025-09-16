const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const Timesheets = sequelize.define('Timesheets', {
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
    projectId: {
        type: DataTypes.STRING(45),
        primaryKey: true
    },
    companyId: {
        type: DataTypes.STRING(45),
        primaryKey: true
    },
    timesheetName: {
        type: DataTypes.STRING(45)
    },
    timesheetMonth: {
        type: DataTypes.STRING(15)
    },
    timesheetYear: {
        type: DataTypes.STRING(45)
    },
    timesheetSummary: {
        type: DataTypes.TEXT('medium')
    },
    uploadedOn: {
        type: DataTypes.DATE
    },
    timesheetRnDHours: {
        type: DataTypes.DECIMAL(19, 2)
    },
    timesheetNonRnDHours: {
        type: DataTypes.DECIMAL(19, 2)
    },
    timesheetUncertainHours: {
        type: DataTypes.DECIMAL(19, 2)
    },
    timesheetReconciledHours: {
        type: DataTypes.DECIMAL(19, 2)
    },
    createdBy: {
        type: DataTypes.STRING(32)
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
    }
}, {
    tableName: 'Timesheets', // Replace with your actual table name
    timestamps: false, // This option prevents Sequelize from renaming the table
});

module.exports = Timesheets;


