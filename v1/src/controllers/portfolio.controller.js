const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const portfolioQueries =  require("../queries/portfolios.queries");
const { v4: uuidv4 } = require('uuid');

const getPortfolio = async (req, res) => {
  try {
    const { 
      companyIds, 
      minProjects, 
      maxProjects, 
      recentlyViewed 
    } = req.query;
    const { user } = req.params;
    let companyIdsArr = [];
    if(companyIds){
      companyIdsArr = JSON.parse(companyIds.replace(/'/g, '"'));
    } else {
      companyIdsArr = req.companyAccess;
    }
    const data = await portfolioQueries.getPortfolios(
      companyIdsArr, 
      minProjects, 
      maxProjects,
      recentlyViewed,
      user
    );
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Portfolios fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const createPortfolio = async (req, res) =>{
  try {
    const { user, company } = req.params;
    const { projects, portfolioName } = req.body;
    const portfolioId = uuidv4().replace(/-/g, '');
    // create portfolio.
    const data = await portfolioQueries.createPortfolio(
      portfolioId,
      portfolioName, 
      company,
      projects.length,
      user 
    );
    // Add corresponding realtions with project
    const projectsArr = JSON.parse(projects.replace(/'/g, '"'));
    const relations = projectsArr.map((item)=>({
      portfolioId,
      "projectId": item, 
      "companyId": company,
      "createdBy": user,
    }));
    await portfolioQueries.createPortfolioRelation(relations);
    return res
      .status(200)
      .json(
        new ApiResponse(data, `Created New Portfolio`)
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}
module.exports = {
    getPortfolio,
    createPortfolio
};
