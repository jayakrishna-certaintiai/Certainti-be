const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const interactions = require("../queries/interactions.queries");
const authQueries = require("../queries/auth.queries");


const getInteractions = async (req, res) => {
  try {
    const { company, user } = req.params;
    const {
      interactionID, 
      interactionActivityType, 
      relatedTo, 
      relationId, 
      interactionTo, 
      createdTime, 
      modifiedTime, 
      status,
      starred 
    } = req.query;
    let interactionActivityTypeArr =[]; 
    let relatedToArr =[];
    let relationIdArr = []; 
    let interactionToArr =[]; 
    let createdTimeArr =[]; 
    let modifiedTimeArr = []; 
    let statusArr = []; 
    if(interactionActivityType){
      interactionActivityTypeArr = JSON.parse(interactionActivityType.replace(/'/g, '"'));
    }
    if(relatedTo){
      relatedToArr = JSON.parse(relatedTo.replace(/'/g, '"'));
    }
    if(relationId){
      relationIdArr = JSON.parse(relationId.replace(/'/g, '"'));
    }
    if(interactionTo){
      interactionToArr = JSON.parse(interactionTo.replace(/'/g, '"'));
    }
    if(createdTime){
      createdTimeArr = JSON.parse(createdTime.replace(/'/g, '"'));
    }
    if(modifiedTime){
      modifiedTimeArr = JSON.parse(modifiedTime.replace(/'/g, '"'));
    }
    if(status){
      statusArr = JSON.parse(status.replace(/'/g, '"'));
    }
    const data = await interactions.getInteractionsList(
      user,
      company,
      interactionActivityTypeArr, 
      relatedToArr, 
      relationIdArr, 
      interactionToArr, 
      createdTimeArr, 
      modifiedTimeArr,
      starred,
      statusArr
    );
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Interactions list fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getInteractionDetail = async (req, res) => {
  try {
    const data = await interactions.getInteractionTrail(req.params.interactionId)

    return res
      .status(200)
      .json(
        new ApiResponse(data, "Interactions details fetched successfully.")
      );    
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const createNewActivity = async (req, res) => {
  try {
    const {user} = req.params;
    const userDetails = await authQueries.getUserProfile(user)
    const userName = userDetails.firstName;

    req.body.createdBy = userName;
    req.body.modifiedBy = userName;
    const { relatedTo, relatedId, companyId, interactionActivityType } = req.body;
    if(
      [relatedTo, relatedId, companyId, interactionActivityType].some((field) => field?.trim() === "")
    ) {
      return res
        .status(422)
        .json(new ApiError("Pass all required fields.", 422));
    }
    const data = await interactions.createActivity(req.body);

    return res
      .status(201)
      .json(
        new ApiResponse(data, "Activity saved successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const deleteInteraction = async (req, res) => {
  try {
    const { company, interactionId } = req.params;
    const data = await interactions.deleteInteraction(company, interactionId);
    return res
      .status(202)
      .json(
        new ApiResponse(data, "Interaction data deleted successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getInteractionByFilter = async (req, res) => {
  try {
    const { company } = req.params; 
    const data = await interactions.getInteractionByFilter(req.query , company);
    return res
      .status(200)
      .json(
        new ApiResponse(data, `Interactions list fetched successfully.`)
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const starInteraction = async (req, res) => {
  try {
    const { interactionId, user } = req.params; 
    const { IsStarred } = req.body;
    const data = await interactions.starActivity(interactionId, user, IsStarred);
    return res
      .status(200)
      .json(
        new ApiResponse(data, `Interactions starred successfully.`)
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const updateInteractionQADetails = async (req, res) => {
  try {
    const { interactionId } = req.params;
    const { interactionDetails, modifiedBy } = req.body;

    if (!Array.isArray(interactionDetails)) {
      return res.status(400).json(new ApiError("Missing or invalid interactionDetails array", 400));
    }

    const updatedRows = await interactions.updateInteractionQADetails(
      interactionId,
      interactionDetails,
      modifiedBy
    );

    return res
      .status(200)
      .json(new ApiResponse(updatedRows, "Interaction Q&A updated successfully."));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};


module.exports = {
  getInteractions,
  getInteractionDetail,
  createNewActivity,
  deleteInteraction,
  getInteractionByFilter,
  starInteraction,
  updateInteractionQADetails
}