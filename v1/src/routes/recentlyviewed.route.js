const { Router } = require("express");
const {
    getRecentlyViewed,
    createRecentlyViewed,
    deleteRecentlyViewed
} = require("../controllers/recentlyviewed.controller");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt");

const recentlyViewedRouter = Router();

recentlyViewedRouter.get("/:user/get-recently-viewed",authorize_jwt, getRecentlyViewed);
recentlyViewedRouter.post("/:user/create-recently-viewed",authorize_jwt, createRecentlyViewed);
recentlyViewedRouter.delete("/:user/delete-recently-viewed/:rvId",authorize_jwt, deleteRecentlyViewed);

module.exports = recentlyViewedRouter;
