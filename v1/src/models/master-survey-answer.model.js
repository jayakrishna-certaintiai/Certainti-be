const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const MasterSurveyAssignment = require("../models/master-survey-assignment.model");
const SystemSurveyQuestion = require("../models/system-survey-question.model");
const MasterSurvey = require("../models/master-survey.model");
const Company = require("../models/company.model");

const MasterSurveyAnswer = sequelize.define('master_survey_answer', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    answer: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    saveddate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    surveyassignmentid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    surveyquestionsid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    surveyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    companyid: {
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
    tableName: 'master_survey_answer',
    timestamps: false,
});

MasterSurveyAnswer.belongsTo(MasterSurveyAssignment, { foreignKey: 'surveyassignmentid' });
MasterSurveyAnswer.belongsTo(SystemSurveyQuestion, { foreignKey: 'surveyquestionsid' });
MasterSurveyAnswer.belongsTo(MasterSurvey, { foreignKey: 'surveyid' });
MasterSurveyAnswer.belongsTo(Company, { foreignKey: 'companyid' });

module.exports = MasterSurveyAnswer;
