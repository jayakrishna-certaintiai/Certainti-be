const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const Portfolios = sequelize.define('Portfolios', {
    portfolioId: {
        type: DataTypes.STRING(32),
        primaryKey: true,
    },
    PortfolioName:{
        type: DataTypes.STRING(256),
    }, 
    companyId: {
        type: DataTypes.STRING(32),
    }, 
    projectCount:{
       type: DataTypes.INTEGER,
    }, 
    portfolioRnDExpense :{
        type: DataTypes.DECIMAL(19, 4)
    }, 
    createdBy: {
        type: DataTypes.STRING(45),
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
  tableName: 'Portfolios', // Replace 'your_table_name' with the actual table name
  timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt fields
});

module.exports = Portfolios;
