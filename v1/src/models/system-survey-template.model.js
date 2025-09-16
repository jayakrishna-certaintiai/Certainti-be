const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const Company = require("./company.model");

const SystemSurveyTemplate = sequelize.define('system_survey_template', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    tier: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    createdby: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    createdtime: {
        type: DataTypes.DATE,
        allowNull: false,
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
    companyid: {
        type: DataTypes.STRING(26)
    }
}, {
    tableName: 'system_survey_template',
    timestamps: false,
});

module.exports = SystemSurveyTemplate;
