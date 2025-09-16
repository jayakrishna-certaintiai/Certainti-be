const { Router } = require("express");
const { getCaseTypes,
    getCaseRoles,
    createCase,
    getAllCases,
    getCase,
    addProjectsToCase,
    removeCaseProjects,
    sendSurveys,
    getSurvey,
    getSurveyById,
    getSurveyStatus,
    controlSurvey,
    sendReminder,
    flagProject,
    getCaseFilterValues,
    getSurveysFilterValues,
    uploadSurveys,
    getCaseProjects,
    downloadSurvey
} = require("../controllers/case.controller.js");
const authorize = require("../middlewares/auth.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");
const caseRouter = Router()
const upload = require("../middlewares/multer.middleware.js");

//case meta data
caseRouter.get("/get-cases-filter-values", authorize_jwt, getCaseFilterValues);
caseRouter.get("/get-surveys-filter-values", authorize_jwt, getSurveysFilterValues);
caseRouter.get("/:user/casetypes", authorize_jwt, getCaseTypes);
caseRouter.get("/:user/caseroles", authorize_jwt, getCaseRoles);

//cases
caseRouter.post("/:user/:companyId/create", authorize_jwt, createCase);
caseRouter.get("/:user/cases", authorize_jwt, getAllCases);
caseRouter.get("/:user/:caseId/casedetails", authorize_jwt, getCase);

//projects
caseRouter.post("/:user/projects/add", authorize_jwt, addProjectsToCase);
caseRouter.get("/:user/:caseId/projects", authorize_jwt, getCaseProjects);
// caseRouter.put("/:user/projects/:caseprojectid/remove", authorize_jwt, removeCaseProjects);
// caseRouter.post("/flag-case-project", authorize_jwt, flagProject);

//surveys
caseRouter.post("/:user/:caseId/sendsurvey", authorize_jwt, sendSurveys);
caseRouter.get("/:user/:caseId/surveylist", authorize_jwt, getSurvey);
caseRouter.get("/:user/:surveyId/surveydetails", authorize_jwt, getSurveyById);
caseRouter.get("/:user/surveytypes", authorize_jwt, getSurveyStatus);
caseRouter.post("/:user/:surveyId/updatesurvey", authorize_jwt, controlSurvey);
caseRouter.post("/send-reminder", authorize_jwt, sendReminder);
caseRouter.post("/:userId/upload-surveys", upload.array("files", 100), uploadSurveys);

//download
caseRouter.get("/download-survey", authorize_jwt, downloadSurvey);

module.exports = caseRouter