const { Router } = require("express");
const {
  getProjects,
  getProjectsKpi,
  getTeamMembers,
  getProjectDetails,
  getTimesheetsByProject,
  getMonthlyFinancialsOfProject,
  editProject,
  addMilestone,
  addProject,
  getProjectsListFromPortfolio,
  addNewTeamMember,
  getSummaryById,
  getSummaryList,
  getInteractionList,
  geInteractionById,
  getProjectTasks,
  triggerAi,
  triggerRnD,
  uploadProjects,
  getProjectsSheets,
  updateMapper,
  getProjectMapper,
  getProjectFilterValues,
  getSummaryFilterValues,
  getInteractionFilterValues,
  getTeamFilterValues,
  getProjectFieldOptions,
  getProjectReport,
  getProjectsList,
  projectFilterValues,
  getTechnicalSummaryReport,
  getInteractionsReport,
  getRnDHistory,
  getRnDContentBySequence,
  sampleProjectSheet,
  getCCEmails,
  updateCCEmails
} = require("../controllers/project.controller");

const authorize = require("../middlewares/auth.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");
const upload = require("../middlewares/multer.middleware.js");


const projectRouter = Router();

//projects
projectRouter.get("/get-projects-filter-values", authorize_jwt, getProjectFilterValues);
projectRouter.get("/get-project-field-options", getProjectFieldOptions);
// Public test route for demo purposes (remove in production)
projectRouter.get("/public/get-projects", async (req, res) => {
  try {
    const Project = require("../models/project.model");
    const projects = await Project.findAll({
      limit: 20,
      order: [['modifiedTime', 'DESC']]
    });
    return res.status(200).json({
      success: true,
      data: projects,
      message: "Projects fetched successfully."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
projectRouter.get("/:user/:company/get-projects", authorize_jwt, getProjects);
projectRouter.get("/:user/:company/projects-kpi", authorize_jwt, getProjectsKpi);
projectRouter.get("/:user/:company/:project/project-details", authorize_jwt, getProjectDetails);
projectRouter.get("/:user/:company/:project/get-project-financials", authorize_jwt, getMonthlyFinancialsOfProject);
projectRouter.post("/:user/:project/edit-project", authorize_jwt, editProject);
projectRouter.post("/:user/:company/:project/add-new-milestone", authorize_jwt, addMilestone);
projectRouter.post("/:user/:company/add-project", authorize_jwt, addProject);
projectRouter.get("/:user/:company/:portfolio/get-project-list", authorize_jwt, getProjectsListFromPortfolio);

projectRouter.get("/:user/projects", authorize_jwt, getProjectsList);
projectRouter.get("/project-filter-values", authorize_jwt, projectFilterValues);


//teammember
projectRouter.get("/get-team-filter-values", authorize_jwt, getTeamFilterValues);
projectRouter.get("/:user/:company/:project/get-team-members", authorize_jwt, getTeamMembers);
projectRouter.post("/:user/:company/:project/add-team-member", authorize_jwt, addNewTeamMember);

//timesheet and tasks
projectRouter.get("/:user/:company/:project/get-timesheets-by-project", authorize_jwt, getTimesheetsByProject);
projectRouter.get("/:user/:projectIdentifier/tasks", authorize_jwt, getProjectTasks);

//summary
projectRouter.get("/get-summary-filter-values", authorize_jwt, getSummaryFilterValues);
projectRouter.get("/:user/summary-list", authorize_jwt, getSummaryList);
projectRouter.get("/:user/:summaryId/summary", authorize_jwt, getSummaryById);

//interaction
projectRouter.get("/get-interaction-filter-values", authorize_jwt, getInteractionFilterValues);
projectRouter.get("/:user/interaction-list", authorize_jwt, getInteractionList);
projectRouter.get("/:user/:interactionId/interaction", authorize_jwt, geInteractionById);


//AI trigger
projectRouter.post("/:projectId/trigger-ai", authorize_jwt, triggerAi);
projectRouter.post("/:projectId/trigger-rnd", authorize_jwt, triggerRnD);

//Upload sheets
projectRouter.post("/:userId/:companyId/projects-upload", upload.single("projects"), authorize_jwt, uploadProjects);
projectRouter.get("/get-projects-sheets", authorize_jwt, getProjectsSheets);

//mapper
projectRouter.post("/:companyId/update-project-mapper", authorize_jwt, updateMapper);
projectRouter.get("/:companyId/get-project-mapper", authorize_jwt, getProjectMapper);

//download
projectRouter.get("/download-project-report", authorize_jwt, getProjectReport);
projectRouter.get("/download-technicalSummary-report", authorize_jwt, getTechnicalSummaryReport);
projectRouter.get("/download-interactions-report", authorize_jwt, getInteractionsReport);
projectRouter.get("/download-project-sample-sheet", authorize_jwt, sampleProjectSheet);

//RnD history
projectRouter.get("/getRnDHistory", authorize_jwt, getRnDHistory);
projectRouter.get("/getRnDContentBySequence", authorize_jwt, getRnDContentBySequence);

// ccmails
projectRouter.get("/:projectId/ccmails", authorize_jwt, getCCEmails);
projectRouter.put("/:projectId/update-ccmails", authorize_jwt, updateCCEmails);

module.exports = projectRouter;
