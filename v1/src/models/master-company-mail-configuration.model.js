const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const MasterCompanyMailConfiguration = sequelize.define('master_company_mail_configuration', {
    id: {
        type: DataTypes.STRING(36),
        primaryKey: true,
    },
    companyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    feature: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    purpose: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    subject: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'master_company_mail_configuration',
    timestamps: false,
});

module.exports = MasterCompanyMailConfiguration;
