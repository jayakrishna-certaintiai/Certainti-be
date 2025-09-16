const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const Portfolio_Projects_Rel = sequelize.define('portfolio_projects_Rel', {
    portfolioId: {
        type: DataTypes.STRING(32),    
        primaryKey: true,
    },
    projectId: {
        type: DataTypes.STRING(32),
        primaryKey: true,
    }, 
    companyId: {
        type: DataTypes.STRING(32),
        primaryKey: true,
    },
    createdBy: {
        type: DataTypes.STRING(32),
    },
    createdTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    modifiedBy: {
        type: DataTypes.STRING(45),
    },
    modifiedTime: {
        type: DataTypes.DATE,
        onUpdate: DataTypes.NOW,
        defaultValue: DataTypes.NOW,
    },
    sysModTime: {
        type: DataTypes.DATE,
    },
}, {
  tableName: 'portfolio_projects_Rel', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

module.exports = Portfolio_Projects_Rel;
