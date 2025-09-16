const { Router } = require("express");
const {
    getAlerts,
    createNewAlert,
    deleteAlert,
    getAlertByFilter
} = require("../controllers/alerts.controller");

const authorize = require("../middlewares/auth.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");


const alertRouter = Router();

alertRouter.get("/:user/:company/get-alerts", authorize_jwt, getAlerts);
alertRouter.post("/:user/:company/create-alert", authorize_jwt, createNewAlert);

alertRouter.delete("/:user/:company/:alertId", authorize_jwt, deleteAlert);
// relations are based on company, projects, workflow, reports, reconcile
alertRouter.get("/:user/:company/get-alerts-with-filters", authorize_jwt, getAlertByFilter);
module.exports = alertRouter;