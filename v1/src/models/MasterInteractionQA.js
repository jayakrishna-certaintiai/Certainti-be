// models/MasterInteractionQA.js

const { DataTypes } = require("sequelize");
const sequelize = require("../setups/db");

const MasterInteractionQA = sequelize.define(
  "MasterInteractionQA",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    question: DataTypes.TEXT,
    answer: DataTypes.TEXT,
    interactionsid: DataTypes.INTEGER,
    modifiedby: DataTypes.STRING,
    modifiedtime: DataTypes.DATE
  },
  {
    tableName: "master_interactions_qa",
    timestamps: false
  }
);

module.exports = MasterInteractionQA;
