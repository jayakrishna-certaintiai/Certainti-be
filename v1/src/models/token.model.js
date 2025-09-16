// const { Sequelize, DataTypes } = require("sequelize");
// const sequelize = require("../setups/db");

// const Token = sequelize.define('Token', {
//     tokenId: {
//         type: DataTypes.STRING(32),
//         primaryKey: true,
//         allowNull: false,
//     },
//     userId: {
//         type: DataTypes.STRING(32),
//         allowNull: false,
//         references: {
//             model: 'platformusers', // Name of the referenced table
//             key: 'userId',          // Name of the referenced column
//         },
//     },
//     accessToken: {
//         type: DataTypes.STRING(1024),
//         allowNull: false,
//     },
//     refreshToken: {
//         type: DataTypes.STRING(1024),
//         allowNull: false,
//     },
//     accessTokenExpiry: {
//         type: DataTypes.DATE,
//         allowNull: false,
//     },
//     refreshTokenExpiry: {
//         type: DataTypes.DATE,
//         allowNull: false,
//     },
//     createdTime: {
//         type: DataTypes.DATE,
//         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//         allowNull: false,
//     },
//     modifiedTime: {
//         type: DataTypes.DATE,
//         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//         allowNull: false,
//         onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
//     },
//     sysModifiedTime: {
//         type: DataTypes.DATE,
//         defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
//         allowNull: false,
//         onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
//     },
//     modifiedBy: {
//         type: DataTypes.STRING(36),
//     },
// }, {
//     tableName: 'tokens', // Explicitly define the table name if different from model name
//     timestamps: false,    // Set to true if you want Sequelize to manage createdAt and updatedAt automatically
// });

// // Define associations if needed
// Token.belongsTo(platformusers, { foreignKey: 'userId' });  // Assuming User model is already defined

// // Export the Token model
// module.exports = Token;
