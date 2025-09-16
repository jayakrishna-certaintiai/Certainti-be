const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../setups/db');

const MasterInteractionsQA = sequelize.define('master_interactions_qa', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    aistatus: {
        type: DataTypes.STRING(16),
        allowNull: true,
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    aiinteractionid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    intentframeworkid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    assessmentid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    projectidentifier: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    companyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    interactionsid: {
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
    tableName: 'master_interactions_qa',
    timestamps: false,
});

module.exports = MasterInteractionsQA;
