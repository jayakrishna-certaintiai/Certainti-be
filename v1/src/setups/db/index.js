const Sequelize = require('sequelize');
const constants = require("../../constants")

const dbName = constants.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: 3306,
    dialect: "mysql",
    pool: {
        max: 10,
        min: 0,
        acquire: 60000, // 60 seconds
        idle: 10000,
    },
    dialectOptions: {
        connectTimeout: 60000, // 60 seconds
    },
    logging: false
});


sequelize.authenticate()
    .then(() => {
        console.log('Database connected successfully');
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error.message);
        console.error('Details:', error);
    });



module.exports = sequelize


