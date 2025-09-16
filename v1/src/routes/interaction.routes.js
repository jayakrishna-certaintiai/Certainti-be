const { Router } = require("express");
const {
    getInteractions,
    getInteractionDetail,
    createNewActivity,
    deleteInteraction,
    getInteractionByFilter,
    starInteraction,
    updateInteractionQADetails
} = require("../controllers/interactions.controller");

const authorize = require("../middlewares/auth.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");

const interactionRouter = Router();

interactionRouter.get("/:user/:company/get-interactions",authorize_jwt, getInteractions);
interactionRouter.get("/:user/:company/get-interaction-detail/:interactionId",authorize_jwt, getInteractionDetail);
interactionRouter.post("/:user/:company/create-activity", authorize_jwt, createNewActivity);

interactionRouter.delete("/:user/:company/:interactionId",authorize_jwt, deleteInteraction);
// relations are based on company, projects, workflow, reports, reconcile
interactionRouter.get("/:user/:company/get-activity-with-filters",authorize_jwt, getInteractionByFilter);
// 
interactionRouter.put("/:user/:company/:interactionId",authorize_jwt, starInteraction);

interactionRouter.put("/:user/:company/:interactionId/questions", authorize_jwt, updateInteractionQADetails);

module.exports = interactionRouter;

