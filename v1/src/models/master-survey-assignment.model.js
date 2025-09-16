const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const MasterSurvey = require("../models/master-survey.model");
const PlatformUser = require("../models/platform-users.model");
const MasterCaseProject = require("../models/master-case-project.model");
const Company = require("../models/company.model");

const MasterSurveyAssignment = sequelize.define('master_survey_assignment', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    otp: {
        type: DataTypes.STRING(6),
        allowNull: true,
    },
    url: {
        type: DataTypes.STRING(256),
        allowNull: true,
    },
    surveyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    platformuserid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    caseprojectid: {
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
    tableName: 'master_survey_assignment',
    timestamps: false,
});

MasterSurveyAssignment.belongsTo(MasterSurvey, { foreignKey: 'surveyid' });
MasterSurveyAssignment.belongsTo(PlatformUser, { foreignKey: 'platformuserid' });
MasterSurveyAssignment.belongsTo(MasterCaseProject, { foreignKey: 'caseprojectid' });
MasterSurveyAssignment.belongsTo(Company, { foreignKey: 'companyid' });

module.exports = MasterSurveyAssignment;
