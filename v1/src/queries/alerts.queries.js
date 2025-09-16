const { Sequelize, Op } = require("sequelize");
const sequelize = require("../setups/db");

const Alerts = require("../models/alerts.model");

const alerts = {
    getalertsList: async function (companyIds){
        let whereClause = {};
        if (companyIds && companyIds.length > 0) {
            whereClause = { 'companyId': companyIds };
        }
        const data = await Alerts.findAll({ where: whereClause });
        return data;
    },
    createAlert: async function (body){
        const data = await Alerts.create({
            companyId: body.companyId,
            relatedTo: body.relatedTo,
            alertTitle: body.alertTitle,
            relationId: body.relationId,
            alertDesc: body.alertDesc,
            status: body.status,
            statusTime: body.statusTime,
            priority: body.priority,
            alertId: body.alertId
        });
        return data;
    },
    getAlertByFilter: async function (filters , company){ 
        const data = await Alerts.findAll({
            where:{
                ...filters,
            }
        });
        return data;
    },
    deleteAlert : async function (companyId, alertId){
        const data = await Alerts.destroy({
          where: {
            alertId, companyId
          },
        });
        return data;
    },
}

module.exports = alerts;