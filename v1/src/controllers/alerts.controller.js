const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const alerts = require("../queries/alerts.queries");

const getAlerts = async (req, res) => {
  try {
    const companyIds = req.companyAccess;
    const data = await alerts.getalertsList(companyIds);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Alerts list fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const createNewAlert = async (req, res) => {
  try {
    const { relatedTo, relatedId, companyId, alertActivityType } = req.body;
    if(
      [relatedTo, relatedId, companyId, alertActivityType].some((field) => field?.trim() === "")
    ) {
      return res
        .status(422)
        .json(new ApiError("Please add all the required fields.", 422));
    }
    const data = await alerts.createAlert(req.body);

    return res
      .status(201)
      .json(
        new ApiResponse(data, "Alert saved successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const deleteAlert = async (req, res) => {
  try {
    const { company, alertId } = req.params;
    const data = await alerts.deleteAlert(company, alertId);
    return res
      .status(202)
      .json(
        new ApiResponse(data, "Alert data deleted successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getAlertByFilter = async (req, res) => {
  try {
    const { company } = req.params; 
    const data = await alerts.getAlertByFilter(req.query , company);
    return res
      .status(200)
      .json(
        new ApiResponse(data, `Alerts list fetched successfully.`)
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};


module.exports = {
  getAlerts,
  createNewAlert,
  deleteAlert,
  getAlertByFilter
}