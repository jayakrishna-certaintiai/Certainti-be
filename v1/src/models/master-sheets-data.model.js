const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../setups/db');

const MasterSheetsData = sequelize.define('master_sheets_data', {
    id: {
        type: DataTypes.STRING(36),
        allowNull: false,
        primaryKey: true,
    },
    companyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    sheetid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    record: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(16),
        allowNull: false,
    },
    createdby: {
        type: DataTypes.STRING(36),
        allowNull: true,
        defaultValue: 'system',
    },
    createdtime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    modifiedby: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    modifiedtime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    sysmodtime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'master_sheets_data',
    timestamps: false,
    hooks: {
        beforeUpdate: (record) => {
            record.sysmodtime = new Date(); // Update sysmodtime before any update
        }
    }
});

module.exports = MasterSheetsData;
