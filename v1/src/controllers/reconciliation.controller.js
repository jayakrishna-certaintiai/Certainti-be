const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const reconciliations = require("../queries/reconciliations.queries");
const interactions = require("../queries/interactions.queries");
const authQueries = require("../queries/auth.queries");
const { axiosRequest } = require("../utils/axios");

const getReconciliations = async (req, res) => {
    try {
      const { companyId, reconcileStatus, timesheetId, projectId, timesheetMonth } = req.query;
      const filters = {}
      if(reconcileStatus){
        filters.reconcileStatus =  JSON.parse(reconcileStatus.replace(/'/g, '"'));
      }
      if(timesheetId){
        filters.timesheetId = JSON.parse(timesheetId.replace(/'/g, '"'));
      }
      if(projectId){
        filters.projectId = JSON.parse(projectId.replace(/'/g, '"'));
      }
      if(timesheetMonth){
        filters.timesheetMonth = JSON.parse(timesheetMonth.replace(/'/g, '"'));
      }
      if(companyId){
        filters.companyId = JSON.parse(companyId.replace(/'/g, '"'));
      }
      const data = await reconciliations.getReconciliationsList(filters);
      return res
        .status(200)
        .json(
          new ApiResponse(data, "Reconciliations List fetched successfully.")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getReconciliationById = async (req, res) => {
  try {
    const data = await reconciliations.getReconciliationOverview(req.params.reconciliationId);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Projects fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const reconcileHours = async (req, res) => {
    try {

      const {user} = req.params;
      const userDetails = await authQueries.getUserProfile(user)
      const userName = userDetails.firstName
      req.body.createdBy = userName;
      req.body.modifiedBy = userName;
      const reconcileId = req.params.reconciliationId;
      const { uncertainHours, rndHours, routineHours, rndTaskDescription, modifiedBy} = req.body
      
      if((parseFloat(rndHours) + parseFloat(routineHours)) > parseFloat(uncertainHours)){
        return res.status(422).json(
          new ApiError("Sum of rnd and routine hrs. should be less than or equal to uncertain hours.", 422)
        )
      }

      const reconcileDetails = await reconciliations.getReconciliationOverview(reconcileId);

      let {timesheetId, projectId, companyId } = reconcileDetails.data;
      
      let payload = {
        timesheetId, projectId, companyId,
        routineHours: parseFloat(routineHours),
        nonRoutineHours: parseFloat(rndHours),
        uncertain: parseFloat(uncertainHours)
      }

      const triggerETL = await axiosRequest(
        "post",
        process.env.RECONCILIATION_ETL_URL,
        payload
      );
      
      if (!triggerETL.Status) {
        return res
          .status(422)
          .json(new ApiError(triggerETL, 422));
      }
      
      const data = await reconciliations.reconcileUncertainHours({
        reconcileRevision: parseInt(uncertainHours),
        reconcileRnDHoursOverride: parseFloat(rndHours),
        reconcileNonRnDHoursOverride: parseFloat(routineHours),
        reconcileSummary: rndTaskDescription,
        modifiedBy: modifiedBy,
        reconcileStatus: (parseFloat(rndHours) + parseFloat(routineHours)) == parseFloat(uncertainHours) ? "Closed": "Open"
      }, reconcileId);

      return res
        .status(200)
        .json(
          new ApiResponse(data, "Uncertain hours reconciled successfully.")
        );
    } catch (error) {
      return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

module.exports = {
  getReconciliations,
  getReconciliationById,
  reconcileHours
}