const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const MasterProjectAISummary = sequelize.define('master_project_ai_summary', {
    id: {
        type: DataTypes.STRING(128),
        primaryKey: true,
        allowNull: false,
    },
    intent_framework_id: {
        type: DataTypes.STRING(128),
        allowNull: false,
    },
    companyId: {
        type: DataTypes.STRING(128),
        allowNull: false,
    },
    projectId: {
        type: DataTypes.STRING(128),
        allowNull: false,
    },
    projectCode: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(16),
        allowNull: false,
    },
    createdtime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    createdby: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    modifiedtime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
    modifiedby: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    sysmodtime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    summary_identifier: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
    },
}, {
    tableName: 'master_project_ai_summary',
    indexes: [
        {
            fields: ['intent_framework_id'],
            name: 'masterprojectaisummary_fk1'
        }
    ],
    timestamps: false,
});

module.exports = MasterProjectAISummary;
