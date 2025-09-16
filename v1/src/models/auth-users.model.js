const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const Users = sequelize.define('Users', {
    userId: {
      type: DataTypes.STRING(45),
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.STRING(45),
      defaultValue: null,
    },
    email: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    refreshToken: {
      type: DataTypes.STRING(255),
      defaultValue: null,
    },
    }, {
        tableName: 'tempUsers', // Replace 'your_table_name' with the actual table name
        timestamps: false, // Set to true if you want Sequelize to manage createdAt and updatedAt columns
    }
);

module.exports = Users;