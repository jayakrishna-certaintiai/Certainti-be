const { Router } = require("express");
const {
    getReconciliations,
    getReconciliationById,
    reconcileHours
} = require("../controllers/reconciliation.controller");

const authorize = require("../middlewares/auth.middleware.js")


const reconcileRouter = Router();

reconcileRouter.get("/:user/:company/get-reconciliations", authorize, getReconciliations);
reconcileRouter.get("/:user/:company/:reconciliationId/get-overview", getReconciliationById);
reconcileRouter.post("/:user/:company/:reconciliationId/reconcile-hours", reconcileHours);

module.exports = reconcileRouter;