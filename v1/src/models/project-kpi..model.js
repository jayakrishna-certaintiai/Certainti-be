const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const TempProjectKPI = sequelize.define(
  "tempProjectKPI",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.STRING(45),
      references: {
        model: "project", // Replace with the actual name of the Project model
        key: "projectId",
      },
    },
    rndPercentage: {
      type: DataTypes.INTEGER,
    },
    ttc: {
      type: DataTypes.DATE,
    },
    uncertainHours: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "tempProjectKPI",
    timestamps: false
  }
);

module.exports = TempProjectKPI;