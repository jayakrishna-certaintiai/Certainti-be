const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");
const PlatformUser = require("../models/platform-users.model");
const Company = require("../models/company.model");
const SystemType = require("../models/system-type.model");

const MasterCase = sequelize.define('master_case', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    caseid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        autoIncrement: true,
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    casecompletionstrategy: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    additionalinformation: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    accountingyear: {
        type: DataTypes.STRING(4),
        allowNull: true,
    },
    assessmentyear: {
        type: DataTypes.STRING(4),
        allowNull: true,
    },
    datacollectioncompletiondate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    reportgenerationdate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    submissiondate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    platformuserid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    companyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    casetypeid: {
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
    tableName: 'master_case',
    timestamps: false,
});

MasterCase.belongsTo(PlatformUser, { foreignKey: 'platformuserid' });
MasterCase.belongsTo(Company, { foreignKey: 'companyid' });
MasterCase.belongsTo(SystemType, { foreignKey: 'casetypeid' });

module.exports = MasterCase;
