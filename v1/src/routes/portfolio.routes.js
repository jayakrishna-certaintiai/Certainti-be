const { Router } = require("express");
const {
    getPortfolio,
    createPortfolio
} = require("../controllers/portfolio.controller");
const authorize = require("../middlewares/auth.middleware.js");

const portfolioRouter = Router();

portfolioRouter.get("/:user/get-portfolios",authorize, getPortfolio);
portfolioRouter.post("/:user/:company/create-portfolio", createPortfolio);
module.exports = portfolioRouter;