const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../setups/db');

const MasterCompanyMapper = sequelize.define('master_company_mapper', {
    id: {
        type: DataTypes.STRING(36),
        allowNull: false,
        primaryKey: true,
    },
    companyid: {
        type: DataTypes.STRING(36),
        allowNull: false,
    },
    sequence: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sheettype: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    columnname: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    sheetcolumnname: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    columntype: {
        type: DataTypes.STRING(16),
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(16),
        allowNull: false,
    },
    createdby: {
        type: DataTypes.STRING(36),
        allowNull: true,
        defaultValue: 'system',
    },
    createdtime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    modifiedby: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    modifiedtime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    sysmodtime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'master_company_mapper',
    timestamps: false,
    hooks: {
        beforeUpdate: (record) => {
            record.sysmodtime = new Date(); // Update sysmodtime before any update
        }
    }
});

module.exports = MasterCompanyMapper;
