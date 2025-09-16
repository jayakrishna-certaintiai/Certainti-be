const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const SystemStatus = require("../models/system-status.model");
const Company = require("../models/company.model");

const MasterSurveyControl = sequelize.define('master_survey_control', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    activedays: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    duedateoffset: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    surveycontrolstatusid: {
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
    tableName: 'master_survey_control',
    timestamps: false,
});

MasterSurveyControl.belongsTo(SystemStatus, { foreignKey: 'surveycontrolstatusid' });
MasterSurveyControl.belongsTo(Company, { foreignKey: 'companyid' });

module.exports = MasterSurveyControl;
