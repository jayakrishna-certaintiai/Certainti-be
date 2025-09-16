const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../setups/db');

const MasterInteractions = sequelize.define('master_interaction', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    interactionsid: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
        allowNull: false,
    },
    spocname: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    spocemail: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    oldspocname: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    oldspocemail: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    otp: {
        type: DataTypes.STRING(8),
        allowNull: true,
    },
    url: {
        type: DataTypes.STRING(256),
        allowNull: true,
    },
    projectidentifier: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    companyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    assessmentid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    statusid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    createdby: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    createdtime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    modifiedby: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    modifiedtime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    sysmodtime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'master_interactions',
    timestamps: false,
});

module.exports = MasterInteractions;
