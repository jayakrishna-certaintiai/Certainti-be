const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");

const Roles = require("../models/roles.model");
const User_Company_Relations = require("../models/user-company-relations.model");
const roleQueries = {
    createRole: async function (body){
        const data = await Roles.create(body);
        return data;
    },
    createUserCompany: async function(body){
        const data = await User_Company_Relations.create(body);
        return data;
    }
};

module.exports = roleQueries