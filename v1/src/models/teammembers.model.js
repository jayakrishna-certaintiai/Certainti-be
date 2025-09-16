const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../setups/db');

const TeamMembers = sequelize.define('teammembers', {
    teamMemberId: {
        type: DataTypes.STRING(45),
        allowNull: false,
        primaryKey: true,
    },
    projectId: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    companyId: {
        type: DataTypes.STRING(45),
        allowNull: false,
    },
    contactId: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    projectRole: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(45),
        allowNull: true,
    },
    createdBy: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    createdTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    modifiedBy: {
        type: DataTypes.STRING(128),
        allowNull: true,
    },
    modifiedTime: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    sysModTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    employeeid: {
        type: DataTypes.STRING(36),
        allowNull: true,
    },
    totalHours: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
    },
    rndhours: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
    },
    hourlyrate: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
    },
    totalcost: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
    },
    rndcost: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
    },
    s_total_cost: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
    },
    rndCredits: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
    },
    qreCost: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: true,
    }
}, {
    tableName: 'teammembers',
    timestamps: false,
});

module.exports = TeamMembers;
