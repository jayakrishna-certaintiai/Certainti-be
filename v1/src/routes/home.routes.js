const { Router } = require("express");
const { welcomeAlerts, homePageKpis } = require("../controllers/home.controller");

const homeRouter = Router();
const authorize = require("../middlewares/auth.middleware");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt");

homeRouter.get("/:user/welcome-alerts", authorize_jwt, welcomeAlerts);
homeRouter.get("/:user/get-kpis", authorize_jwt, homePageKpis);

module.exports = homeRouter;
