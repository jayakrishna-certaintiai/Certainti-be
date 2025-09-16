const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const MasterSheet = sequelize.define('master_sheet', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    sheetid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        autoIncrement: true,
    },
    sheettype: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    sheetname: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(32),
        allowNull: true,
        defaultValue: 'uploaded',
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    companyid: {
        type: DataTypes.STRING(36),
    },
    totalrecords: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    acceptedrecords: {
        type: DataTypes.INTEGER,
        allowNull: true
    }, rejectedrecords: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    createdby: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    createdtime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    modifiedby: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    modifiedtime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    sysmodtime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    projectid: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    caseid: {
        type: DataTypes.STRING(36),
        allowNull: true,
    }
}, {
    tableName: 'master_sheets',
    timestamps: false,
});

module.exports = MasterSheet;
