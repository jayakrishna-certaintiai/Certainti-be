const { Router } = require("express");
const {
  uploadTimesheet,
  fetchTimesheetUploadLogs,
  checkToUpdate,
  fetchTimesheetDetails,
  reUploadTimesheet,
  triggerAi,
  getTimesheetFilterValues,
  getTimesheetTasksFilterValues,
  getTasks
} = require("../controllers/timesheet.controller.js");
const upload = require("../middlewares/multer.middleware.js");

const authorize = require("../middlewares/auth.middleware.js");
const { validateTimesheet } = require("../middlewares/timesheet-validator.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");

const timesheetRouter = Router();

timesheetRouter.get("/get-timesheet-filter-values", authorize_jwt, getTimesheetFilterValues);

timesheetRouter.get("/get-timesheettasks-filter-values", getTimesheetTasksFilterValues);

timesheetRouter.get("/get-tasks", getTasks);

timesheetRouter.post(
  "/:userId/:companyId/timesheet-upload",
  upload.single("timesheet"),
  authorize_jwt,
  validateTimesheet,
  uploadTimesheet
);

timesheetRouter.post(
  "/:userId/:companyId/check-timesheet-status",
  authorize_jwt,
  checkToUpdate
);


timesheetRouter.get(
  "/:user/:companyId/timesheet-logs",
  authorize_jwt,
  fetchTimesheetUploadLogs
);

timesheetRouter.get(
  "/:userId/:companyId/:timesheetId/get-timesheet-details",
  authorize_jwt,
  fetchTimesheetDetails
);

timesheetRouter.post(
  "/:userId/:companyId/:timesheetId/timesheet-reupload",
  authorize_jwt,
  upload.single("timesheet"),
  reUploadTimesheet
);

timesheetRouter.post(
  "/:timesheetId/trigger-ai",
  authorize_jwt,
  triggerAi
);

module.exports = timesheetRouter;
