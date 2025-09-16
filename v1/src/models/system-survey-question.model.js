const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const SystemSurveyTemplate = require("../models/system-survey-template.model");

const SystemSurveyQuestion = sequelize.define('system_survey_question', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    surveytemplateid: {
        type: DataTypes.STRING(36),
        allowNull: false,
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
}, {
    tableName: 'system_survey_question',
    timestamps: false,
});

SystemSurveyQuestion.belongsTo(SystemSurveyTemplate, { foreignKey: 'surveytemplateid' });

module.exports = SystemSurveyQuestion;
