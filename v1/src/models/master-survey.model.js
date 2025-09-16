const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const SystemStatus = require("../models/system-status.model");
const MasterSurveyControl = require("../models/master-survey-control.model");
const SystemSurveyTemplate = require("../models/system-survey-template.model");
const Company = require("../models/company.model");
const Project = require("../models/project.model");

const MasterSurvey = sequelize.define('master_survey', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    surveyid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        autoIncrement: true,
    },
    surveyname: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    sentdate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    closedate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    surveystatusid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    surveycontrolid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    surveyquestionstemplateid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    companyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    projectid: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    createdby: {
        type: DataTypes.STRING(36),
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
    aistatus: {
        type: DataTypes.STRING(16),
        allowNull: true,
    },
}, {
    tableName: 'master_survey',
    timestamps: false,
});

MasterSurvey.belongsTo(SystemStatus, { foreignKey: 'surveystatusid' });
MasterSurvey.belongsTo(MasterSurveyControl, { foreignKey: 'surveycontrolid' });
MasterSurvey.belongsTo(SystemSurveyTemplate, { foreignKey: 'surveyquestionstemplateid' });
MasterSurvey.belongsTo(Company, { foreignKey: 'companyid' });
MasterSurvey.belongsTo(Project, { foreignKey: 'projectId' });

module.exports = MasterSurvey;
