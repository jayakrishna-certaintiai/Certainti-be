const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const MasterCase = require("../models/master-case.model");
const Project = require("../models/project.model");
const Company = require("../models/company.model");

const MasterCaseProject = sequelize.define('master_case_project', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    caseprojectid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        autoIncrement: true,
    },
    projectname: {
        type: DataTypes.STRING(45),
    },
    caseid: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    projectid: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    projectmanager: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    technicalcontact: {
        type: DataTypes.STRING(128),
        allowNull: true,
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
    totalefforts: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    totalcosts: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    totalrndefforts: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    totalrndcosts: {
        type: DataTypes.FLOAT,
        allowNull: true,
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
    flag: {
        type: DataTypes.BOOLEAN,
        default: false
    },
    flagmessage: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'master_case_project',
    timestamps: false,
});

MasterCaseProject.belongsTo(MasterCase, { foreignKey: 'caseid' });
// MasterCaseProject.belongsTo(Project, { foreignKey: 'projectId' });
MasterCaseProject.belongsTo(Company, { foreignKey: 'companyid' });

module.exports = MasterCaseProject;
