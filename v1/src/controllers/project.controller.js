const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const projects = require("../queries/project.queries");
const authQueries = require("../queries/auth.queries");
const contactQueries = require("../queries/contact.queries");
const projectQueries = require("../queries/project.queries");
const MasterProjectAISummary = require("../models/master-project-ai-summary.model");
const assessmentQueries = require("../queries/assessment.queries");
const MasterInteractions = require('../models/master-interactions.model');
const Project = require("../models/project.model");
const { axiosRequest } = require("../utils/axios");
const Company = require("../models/company.model");
const { uploadFileToAzureStorage } = require('../utils/azureBlobStorage');
const { v4: uuidv4 } = require("uuid");
const MasterSheet = require("../models/master-sheets.model");
const fileToDatabse = require("../utils/fileToDatabase");
const sheetQueries = require("../queries/sheets.queries");
const PlatformUsers = require("../models/platform-users.model");
const { reportForProjects, projectSampleSheet } = require("../utils/csv");
const fs = require('fs');
const { reportForTechnicalSummaries } = require("../utils/csv");
const { reportForInteractions } = require("../utils/csv");
const { packageAsZip } = require("../utils/zipModule");
const ExcelJS = require('exceljs');

const getProjectFieldOptions = async (req, res) => {
  try {
    const data = await projectQueries.getProjectFiledOptions();
    return res.status(200).json(new ApiResponse(data, "Projects field options fetched successfully.", true));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};


const projectFilterValues = async (req, res) => {
  try {

    const filter = {
      caseId: req.query.caseId ? req.query.caseId : null
    }

    const data = await projectQueries.projectFilterValues(filter);

    return res.status(200).json(new ApiResponse(data, "Projects filters values fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const getProjectFilterValues = async (req, res) => {
  try {

    const filter = {
      caseId: req.query.caseId,
      companyId: req.query.companyId,
      timesheetId: req.query.timesheetId,
      contactId: req.query.contactId
    };

    const data = await projectQueries.getProjectFilterValues(filter);

    return res.status(200).json(new ApiResponse(data, "Projects filters values fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getSummaryFilterValues = async (req, res) => {
  try {

    const { caseId, projectId } = req.query;

    const filter = { caseId, projectId };

    const data = await projectQueries.getSummaryFilterValues(filter);

    return res.status(200).json(new ApiResponse(data, "Summary filters values fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getInteractionFilterValues = async (req, res) => {
  try {

    const filter = { caseId: req.query.caseId, projectId: req.query.projectIdentifier };

    const data = await projectQueries.getInteractionFilterValues(filter);

    return res.status(200).json(new ApiResponse(data, "Interaction filters values fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};


const getTeamFilterValues = async (req, res) => {
  try {

    const filter = {
      projectId: req.query.projectId
    };

    const data = await projectQueries.getTeamFilterValues(filter);

    return res.status(200).json(new ApiResponse(data, "Interaction filters values fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};


const getProjectsList = async (req, res) => {
  try {

    const filters = {
      projectIdentifiers: req.query.projectIdentifiers ? JSON.parse(req.query.projectIdentifiers.replace(/'/g, '"')) : null,
      projectIds: req.query.projectIds ? JSON.parse(req.query.projectIds.replace(/'/g, '"')) : null,
      projectCodes: req.query.projectCodes ? JSON.parse(req.query.projectCodes.replace(/'/g, '"')) : null,
      projectNames: req.query.projectNames ? JSON.parse(req.query.projectNames.replace(/'/g, '"')) : null,
      spocNames: req.query.spocNames ? JSON.parse(req.query.spocNames.replace(/'/g, '"')) : null,
      spocEmails: req.query.spocEmails ? JSON.parse(req.query.spocEmails.replace(/'/g, '"')) : null,
      projectTypes: req.query.projectTypes ? JSON.parse(req.query.projectTypes.replace(/'/g, '"')) : null,

      companyIds: req.query.companyIds ? JSON.parse(req.query.companyIds.replace(/'/g, '"')) : null,
      companyNames: req.query.companyNames ? JSON.parse(req.query.companyNames.replace(/'/g, '"')) : null,
      fiscalYears: req.query.fiscalYears ? JSON.parse(req.query.fiscalYears.replace(/'/g, '"')) : null,

      projectStatuses: req.query.projectStatuses ? JSON.parse(req.query.projectStatuses.replace(/'/g, '"')) : null,
      dataGatherings: req.query.dataGatherings ? JSON.parse(req.query.dataGatherings.replace(/'/g, '"')) : null,
      pendingDatas: req.query.pendingDatas ? JSON.parse(req.query.pendingDatas.replace(/'/g, '"')) : null,
      timesheetStatuses: req.query.timesheetStatuses ? JSON.parse(req.query.timesheetStatuses.replace(/'/g, '"')) : null,
      fteCostStatuses: req.query.fteCostStatuses ? JSON.parse(req.query.fteCostStatuses.replace(/'/g, '"')) : null,
      subconCostStatuses: req.query.subconCostStatuses ? JSON.parse(req.query.subconCostStatuses.replace(/'/g, '"')) : null,
      technicalInterviewStatuses: req.query.technicalInterviewStatuses ? JSON.parse(req.query.technicalInterviewStatuses.replace(/'/g, '"')) : null,
      technicalSummaryStatuses: req.query.technicalSummaryStatuses ? JSON.parse(req.query.technicalSummaryStatuses.replace(/'/g, '"')) : null,
      financialSummaryStatuses: req.query.financialSummaryStatuses ? JSON.parse(req.query.financialSummaryStatuses.replace(/'/g, '"')) : null,
      claimsFormStatuses: req.query.claimsFormStatuses ? JSON.parse(req.query.claimsFormStatuses.replace(/'/g, '"')) : null,
      finalReviewStatuses: req.query.finalReviewStatuses ? JSON.parse(req.query.finalReviewStatuses.replace(/'/g, '"')) : null,
      rndStatuses: req.query.rndStatuses ? JSON.parse(req.query.rndStatuses.replace(/'/g, '"')) : null,
      surveyStatuses: req.query.surveyStatuses ? JSON.parse(req.query.surveyStatuses.replace(/'/g, '"')) : null,
      interactionStatuses: req.query.interactionStatuses ? JSON.parse(req.query.interactionStatuses.replace(/'/g, '"')) : null,

      lastUpdatedBys: req.query.lastUpdatedBys ? JSON.parse(req.query.lastUpdatedBys.replace(/'/g, '"')) : null,


      rndCredits: req.query.rndCredits ? JSON.parse(req.query.rndCredits.replace(/'/g, '"')) : null,
      fteCosts: req.query.fteCosts ? JSON.parse(req.query.fteCosts.replace(/'/g, '"')) : null,
      subconCosts: req.query.subconCosts ? JSON.parse(req.query.subconCosts.replace(/'/g, '"')) : null,
      totalProjectCosts: req.query.totalProjectCosts ? JSON.parse(req.query.totalProjectCosts.replace(/'/g, '"')) : null,
      FTEhours: req.query.FTEhours ? JSON.parse(req.query.FTEhours.replace(/'/g, '"')) : null,
      SubconHours: req.query.SubconHours ? JSON.parse(req.query.SubconHours.replace(/'/g, '"')) : null,
      TotalHours: req.query.TotalHours ? JSON.parse(req.query.TotalHours.replace(/'/g, '"')) : null,
      rndAdjustments: req.query.rndAdjustments ? JSON.parse(req.query.rndAdjustments.replace(/'/g, '"')) : null,
      fteQreCosts: req.query.fteQreCosts ? JSON.parse(req.query.fteQreCosts.replace(/'/g, '"')) : null,
      subconQreCosts: req.query.subconQreCosts ? JSON.parse(req.query.subconQreCosts.replace(/'/g, '"')) : null,
      qreCosts: req.query.qreCosts ? JSON.parse(req.query.qreCosts.replace(/'/g, '"')) : null,
      rndPotentials: req.query.rndPotentials ? JSON.parse(req.query.rndPotentials.replace(/'/g, '"')) : null,
      rndFinals: req.query.rndFinals ? JSON.parse(req.query.rndFinals.replace(/'/g, '"')) : null,

      lastUpdatedTimestamps: req.query.lastUpdatedTimestamps ? JSON.parse(req.query.lastUpdatedTimestamps.replace(/'/g, '"')) : null,
      surveySentDates: req.query.surveySentDates ? JSON.parse(req.query.surveySentDates.replace(/'/g, '"')) : null,
      reminderSentDates: req.query.reminderSentDates ? JSON.parse(req.query.reminderSentDates.replace(/'/g, '"')) : null,
      surveyResponseDates: req.query.surveyResponseDates ? JSON.parse(req.query.surveyResponseDates.replace(/'/g, '"')) : null,
    }

    const sort = {
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder
    }

    const others = {
      caseId: req.query.caseId ? req.query.caseId : null,
      caseCompanyId: req.query.caseCompanyId ? req.query.caseCompanyId : null,
    }

    const projectList = await projectQueries.getProjectsList(sort, filters, others);

    return res.status(200).json(new ApiResponse(projectList, "Projects List Fetched Successfully", true));


  } catch (error) {
    console.log("Projects Controller : ", error);
    return res.status(500).json(new ApiError("Internal Server Error : Unable to fetch projects.", 500, error));
  }
}


const getProjects = async (req, res) => {
  try {

    const filter = {
      projectIds: req.query.projectIds ? JSON.parse(req.query.projectIds.replace(/'/g, '"')) : null,
      projectNames: req.query.projectNames ? JSON.parse(req.query.projectNames.replace(/'/g, '"')) : null,
      projectCodes: req.query.projectCodes ? JSON.parse(req.query.projectCodes.replace(/'/g, '"')) : null,
      fiscalYears: req.query.fiscalYears ? JSON.parse(req.query.fiscalYears.replace(/'/g, '"')) : null,
      spocNames: req.query.spocNames ? JSON.parse(req.query.spocNames.replace(/'/g, '"')) : null,
      spocEmails: req.query.spocEmails ? JSON.parse(req.query.spocEmails.replace(/'/g, '"')) : null,

      minTotalExpense: req.query.minTotalExpense ? req.query.minTotalExpense : null,
      maxTotalExpense: req.query.maxTotalExpense ? req.query.maxTotalExpense : null,
      minRnDExpense: req.query.minRnDExpense ? req.query.minRnDExpense : null,
      maxRnDExpense: req.query.maxRnDExpense ? req.query.maxRnDExpense : null,
      minRnDPotential: req.query.minRnDPotential ? req.query.minRnDPotential : null,
      maxRnDPotential: req.query.maxRnDPotential ? req.query.maxRnDPotential : null,

      companyIds: req.query.companyIds ? JSON.parse(req.query.companyIds.replace(/'/g, '"')) : null,

      caseSpocNames: req.query.caseSpocNames ? JSON.parse(req.query.caseSpocNames.replace(/'/g, '"')) : null,
      caseSpocEmails: req.query.caseSpocEmails ? JSON.parse(req.query.caseSpocEmails.replace(/'/g, '"')) : null,
    }

    const sort = {
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder
    };

    const others = {
      timesheetId: req.query.timesheetId,
      caseId: req.query.caseId,
      caseCompanyId: req.query.caseCompanyId ? req.query.caseCompanyId : null,
      contactId: req.query.contactId
    }

    const projectList = await projectQueries.getProjects(filter, sort, others);

    return res.status(200).json(new ApiResponse(projectList, "Projects fetched successfully.", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const getProjectsListFromPortfolio = async (req, res) => {
  try {
    const { portfolio } = req.params;
    const data = await projects.getProjectsListFromPortfolio(portfolio);
    return res
      .status(200)
      .json(
        new ApiResponse(data, `Projects fetched successfully for porfolio with Id ${portfolio}`)
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getProjectsKpi = async (req, res) => {
  try {
    const { companyId } = req.params;
    const data = await projects.getKpi(req.companyAccess);
    return res
      .status(200)
      .json(new ApiResponse(data, "Projects KPIs fetched successfully."));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getTeamMembers = async (req, res) => {
  try {

    const filter = {
      projectId: req.query.projectId,
      names: req.query.names ? JSON.parse(req.query.names.replace(/'/g, '"')) : null,
      projectRoles: req.query.projectRoles ? JSON.parse(req.query.projectRoles.replace(/'/g, '"')) : null,
      minHourlyrate: req.query.minTotalHourlyrate,
      maxHourlyrate: req.query.maxTotalHourlyrate,
      minTotalHours: req.query.minTotalHours,
      maxTotalHours: req.query.maxTotalHours,
      minTotalExpense: req.query.minTotalExpense,
      maxTotalExpense: req.query.maxTotalExpense,
      minRnDExpense: req.query.minRnDExpense,
      maxRnDExpense: req.query.maxRnDExpense
    }

    const sort = { sortField, sortOrder } = req.query;

    const data = await projects.getTeam(filter, sort);

    return res
      .status(200)
      .json(new ApiResponse(data, "Project Team Members fetched successfully."));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { company, project } = req.params;
    const data = await projects.getProjectDetails(project);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Project Details fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getTimesheetsByProject = async (req, res) => {
  try {
    const { company, project } = req.params;
    const data = await projects.getTimesheetByProject(company, project);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Project Timesheets fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getMonthlyFinancialsOfProject = async (req, res) => {
  try {
    const { company, project } = req.params;
    const data = await projects.getFinancialsByProject(company, project);
    return res
      .status(200)
      .json(
        new ApiResponse(data, "Project Financials data fetched successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const editProject = async (req, res) => {
  try {
    const { user } = req.params;
    let editFields = req.body.editFields;

    // Convert project IDs to remove any extra quotes around them
    let cleanedEditFields = {};
    for (let projectId in editFields) {
      const cleanProjectId = projectId.replace(/['"]+/g, '');
      cleanedEditFields[cleanProjectId] = editFields[projectId];
    }

    // Fetch user details
    let platformUser = await PlatformUsers.findOne({ where: { userId: user } });
    platformUser = platformUser.dataValues;

    // Update each project with the new details
    for (let projectId in cleanedEditFields) {
      cleanedEditFields[projectId].s_last_updated_by = `${platformUser.firstName} ${platformUser.middleName} ${platformUser.lastName}`;
      cleanedEditFields[projectId].s_last_updated_timestamp = new Date().toISOString();
      cleanedEditFields[projectId].projectId = projectId;

      await projects.editProjectDetails(projectId, cleanedEditFields[projectId]);
    }

    return res
      .status(201)
      .json(
        new ApiResponse(null, "Project details data saved successfully.", true)
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};


const addMilestone = async (req, res) => {
  try {
    const { company, project } = req.params;
    const data = await projects.addNewMilestone(project, company, req.body);
    return res
      .status(201)
      .json(
        new ApiResponse(data, "Project details data saved successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const addProject = async (req, res) => {
  try {
    const { user, company } = req.params;
    const userDetails = await authQueries.getUserProfile(user)
    const userName = userDetails.firstName;
    req.body.projectDetails.createdBy = userName;
    req.body.projectDetails.modifiedBy = userName;

    const data = await projects.addProjectDetails(req.body.projectDetails);

    if (data.projectId && data.projectManagerId) {
      const createPM = await projects.addTeamMember({
        contactId: data.projectManagerId,
        projectId: data.projectId,
        companyId: req.body.projectDetails.companyId || company
      })

      if (createPM) {
        await projects.editProjectDetails(data.projectId, req.body.projectDetails.companyId, { projectManagerId: createPM.teamMemberId })
      }
    }
    if (req.body.milestones && req.body.milestones.length > 0) {
      for (let data1 of req.body.milestones) {
        data1.createdBy = userName;
        data1.modifiedBy = userName;
        const createMilestone = await projects.addNewMilestone(data.projectId, company, data1)
      }
    }
    return res
      .status(201)
      .json(
        new ApiResponse(data, "Project details data saved successfully.")
      );
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const addNewTeamMember = async (req, res) => {
  try {

    const { existingContact } = req.body
    const { company, user, project } = req.params;
    const userDetails = await authQueries.getUserProfile(user)
    const userName = userDetails.firstName;
    req.body.createdBy = userName;
    req.body.modifiedBy = userName;

    if (existingContact) {
      const { contactId, role, createdBy, modifiedBy } = req.body;
      const createTeamMember = await projects.addTeamMember({ companyId: company, projectId: project, contactId, projectRole: role, createdBy, modifiedBy });
      return res.status(201).json(
        new ApiResponse(createTeamMember, "Team Member added successfully.")
      )
    } else {
      req.body.companyId = company;

      const existedUser = await contactQueries.getExistingContact({
        email: req.body.email
      });

      if (existedUser) {
        return res
          .status(422)
          .json(new ApiError("User with same email already exists.", 422));
      }
      const newContact = await contactQueries.createNewContact(req.body);
      if (newContact) {
        let contactId = newContact.contactId;
        let { role, createdBy, modifiedBy } = req.body;

        const createTeamMember = await projects.addTeamMember({ companyId: company, projectId: project, contactId, projectRole: role, createdBy, modifiedBy })
        return res.status(201).json(
          new ApiResponse(createTeamMember, "Contact and Team Member added successfully.")
        )
      }
    }

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const getSummaryList = async (req, res) => {
  try {

    const filter = {
      caseId: req.query.caseId ? req.query.caseId : null,
      projectId: req.query.projectIdentifier ? req.query.projectIdentifier : null,
      caseProjectIds: req.query.caseProjectIds ? JSON.parse(req.query.caseProjectIds.replace(/'/g, '"')) : null,
      caseProjectCodes: req.query.caseProjectCodes ? JSON.parse(req.query.caseProjectCodes.replace(/'/g, '"')) : null,
      caseProjectNames: req.query.caseProjectNames ? JSON.parse(req.query.caseProjectNames.replace(/'/g, '"')) : null,
      createdOnStartDate: req.query.createdOnStartDate ? req.query.createdOnStartDate : null,
      createdOnEndDate: req.query.createdOnEndDate ? req.query.createdOnEndDate : null,
      status: req.query.summaryStatus ? JSON.parse(req.query.summaryStatus.replace(/'/g, '"')) : null,
    };

    const sort = {
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder
    };

    const summaryList = await projectQueries.getSummaryList(filter, sort);

    return res.status(200).json(new ApiResponse(summaryList, "Summaries fetched successfully", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const getSummaryById = async (req, res) => {
  try {

    let summaryId = req.params.summaryId;
    const { projectId } = req.query;

    if (projectId) {
      const summary = await MasterProjectAISummary.findOne({ where: { projectId: projectId, status: 'active' } });
      if (!summary) {
        return res.status(200).json(new ApiResponse(null, "No Summary Generated", false));
      }
      summaryId = summary.dataValues.id;
    }
    const aiSummary = await MasterProjectAISummary.findOne({ where: { id: summaryId } });

    if (!aiSummary) {
      if (projectId) {
        return res.status(200).json(new ApiResponse(null, "No Summary Generated", false));
      }
      return res.status(200).json(new ApiResponse(null, "Invalid Summary Id.", false));
    }

    const summaryData = await projectQueries.getSummary(summaryId);

    return res.status(200).json(new ApiResponse(summaryData, "Summary fetched successfully", true));


  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const getInteractionList = async (req, res) => {
  try {

    const filter = {
      caseId: req.query.caseId ? req.query.caseId : null,
      projectId: req.query.projectIdentifier ? req.query.projectIdentifier : null,
      caseProjectIds: req.query.caseProjectIds ? JSON.parse(req.query.caseProjectIds.replace(/'/g, '"')) : null,
      caseProjectCodes: req.query.caseProjectCodes ? JSON.parse(req.query.caseProjectCodes.replace(/'/g, '"')) : null,
      caseProjectNames: req.query.caseProjectNames ? JSON.parse(req.query.caseProjectNames.replace(/'/g, '"')) : null,
      sentToEmails: req.query.sentToEmails ? JSON.parse(req.query.sentToEmails.replace(/'/g, '"')) : null,
      sentStartDate: req.query.sentStartDate ? req.query.sentStartDate : null,
      sentEndDate: req.query.sentEndDate ? req.query.sentEndDate : null,
      responseReceivedStartDate: req.query.responseReceivedStartDate ? req.query.responseReceivedStartDate : null,
      responseReceivedEndDate: req.query.responseReceivedEndDate ? req.query.responseReceivedEndDate : null,
      status: req.query.interactionStatus ? JSON.parse(req.query.interactionStatus.replace(/'/g, '"')) : null,
    };

    const sort = {
      sortField: req.query.sortField,
      sortOrder: req.query.sortOrder
    };

    const interactionList = await projectQueries.getInteractionsList(filter, sort);

    return res.status(200).json(new ApiResponse(interactionList, "Summaries fetched successfully", true));

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const geInteractionById = async (req, res) => {
  try {
    const interactionId = req.params.interactionId;

    //get project
    const interaction = await MasterInteractions.findOne({ where: { id: interactionId } });
    if (!interaction) {
      return res.status(400).json(new ApiResponse(null, "Invalid interaction id", false));
    }

    const interactionDetails = await assessmentQueries.getInteractionById(interactionId);

    return res.status(200).json(new ApiResponse(interactionDetails, "Interaction details fetched successfully", true));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getProjectTasks = async (req, res) => {
  try {

    const projectIdentifier = req.params.projectIdentifier;
    const { page, limit } = req.query;

    const timesheetTasks = await projectQueries.getProjectTasks(projectIdentifier, limit, page);


    return res.status(200).json(new ApiResponse(timesheetTasks, "Tasks fetched successfully", true));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const triggerAi = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      where: {
        projectId: projectId
      }
    });

    if (!project) {
      return res.status(400).json(new ApiResponse(null, "Invalid project id", false));
    }

    const triggerSummary = axiosRequest(
      "post",
      process.env.AI_GENERATE_SUMMARY,
      {
        projectId: projectId,
        companyId: project.dataValues.companyId
      }
    );

    return res.status(200).json(new ApiResponse(null, "AI trigerred for the project", true));
  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const triggerRnD = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      where: {
        projectId: projectId
      }
    });

    if (!project) {
      return res.status(400).json(new ApiResponse(null, "Invalid project id", false));
    }

    const triggerRnDCalculate = axiosRequest(
      "post",
      process.env.AI_RND_CALCULATE,
      {
        projectId: projectId,
        companyId: project.dataValues.companyId
      }
    );

    return res.status(200).json(new ApiResponse(null, "R&D calculation triggered for the project", true));
  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const uploadProjects = async (req, res) => {
  try {
    const { companyId, userId } = req.params;

    const company = await Company.findOne({
      where: {
        companyId: companyId
      }
    });

    if (!company) {
      return res.status(400).json(new ApiResponse(null, "Invalid company id", false));
    }

    //check file
    const file = req.file;
    if (!file) {
      return res.status(422).json(
        new ApiError(
          "File not found, Upload again.",
          422
        )
      )
    }

    //upload to azure
    const projectSheet = await uploadFileToAzureStorage(file);

    //make an entry for project sheet in master-sheet
    const masterSheetData = {
      id: uuidv4(),
      sheettype: "projects",
      sheetname: file.originalname,
      url: projectSheet.url,
      companyid: companyId,
      createdby: userId
    };
    const savedProjectSheet = await MasterSheet.create(masterSheetData);

    fileToDatabse.projectsSheetsProcessor(userId, savedProjectSheet.dataValues.id, companyId, file);

    return res.status(200).json(new ApiResponse(null, "Project sheet uploaded successfully.", true));
  }
  catch (error) {
    console.log(error);
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const getProjectsSheets = async (req, res) => {
  try {
    const { companyId } = req.query;

    const projectsSheets = await projectQueries.getProjectsSheets(companyId);
    return res.status(200).json(new ApiResponse(projectsSheets, "Projects Sheets fetched successfully.", true));
  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}

const updateMapper = async (req, res) => {
  try {

    const { companyId } = req.params;
    const { newColumns, updateColumns } = req.body;
    const sheetType = 'projects';

    await sheetQueries.addNewColumns(companyId, sheetType, newColumns);
    await sheetQueries.updateColumns(companyId, sheetType, updateColumns);

    return res.status(200).json(new ApiResponse(null, "Projects mapper updates successfully", true));

  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const getProjectMapper = async (req, res) => {
  try {

    const { companyId } = req.params;

    const sheetType = 'projects';

    let companyProjectsMapper = await sheetQueries.getCompanyMapper(companyId, sheetType);

    //if mapper does not exist, create the default one
    if (!companyProjectsMapper || companyProjectsMapper.length == 0) {
      await sheetQueries.createCompanyProjectMapper(companyId);
    }

    companyProjectsMapper = await sheetQueries.getCompanyMapper(companyId, sheetType);

    return res.status(200).json(new ApiResponse(companyProjectsMapper, "Projects Mapper fetched Successfully", true));
  }
  catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
}


const getProjectReport = async (req, res) => {
  try {
    const companyIds = req.query.companyIds ? JSON.parse(req.query.companyIds.replace(/'/g, '"')) : null;

    // Generate the file and get its path
    const filePath = await reportForProjects(companyIds);

    // Set headers for Excel file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="ProjectReport.xlsx"');

    // Read the file and pipe it to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up the file after download (optional)
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete temporary file:", err);
      });
    });

  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};

const getTechnicalSummaryReport = async (req, res) => {
  try {
    const { projectId, caseId, format } = req.query;
    let technicalSummaryIds = req.query.technicalSummaryIds ? JSON.parse(req.query.technicalSummaryIds.replace(/'/g, '"')) : null;

    //validate the request
    if (format && (format != 'pdf' && format != 'docx')) {
      return res.status(400).json(new ApiResponse(null, "Invalid File Type", false));
    }
    technicalSummaryIds = technicalSummaryIds ? technicalSummaryIds : await projectQueries.getTechnicalSummaryIds(projectId, caseId);
    const filePaths = await reportForTechnicalSummaries(technicalSummaryIds, format);

    if (filePaths.length > 0) {
      const zipPath = await packageAsZip(filePaths);
      res.setHeader('Content-Disposition', 'attachment; filename="TechnicalSummaries.zip"');
      res.sendFile(zipPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
        }

        // Delete individual files
        filePaths.forEach(filePath => {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error(`Error deleting file ${filePath}:`, unlinkErr);
          });
        });

        // Delete the ZIP file
        fs.unlink(zipPath, (unlinkErr) => {
          if (unlinkErr) console.error(`Error deleting zip file ${zipPath}:`, unlinkErr);
        });
      });
    }
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({ message: "Error generating report", error });
  }
};

const getInteractionsReport = async (req, res) => {
  try {
    const { projectId, caseId, format } = req.query;
    let interactionsIds = req.query.interactionsIds ? JSON.parse(req.query.interactionsIds.replace(/'/g, '"')) : null;

    //validate the request
    if (format && (format != 'pdf' && format != 'docx')) {
      return res.status(400).json(new ApiResponse(null, "Invalid File Type", false));
    }
    interactionsIds = interactionsIds ? interactionsIds : await projectQueries.getInteractionsIds(projectId, caseId);
    const filePaths = await reportForInteractions(interactionsIds, format);

    if (filePaths.length > 0) {
      const zipPath = await packageAsZip(filePaths);
      res.setHeader('Content-Disposition', 'attachment; filename="Interactions.zip"');
      res.sendFile(zipPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
        }

        // Delete individual files
        filePaths.forEach(filePath => {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error(`Error deleting file ${filePath}:`, unlinkErr);
          });
        });

        // Delete the ZIP file
        fs.unlink(zipPath, (unlinkErr) => {
          if (unlinkErr) console.error(`Error deleting zip file ${zipPath}:`, unlinkErr);
        });
      });
    }
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({ message: "Error generating report", error });
  }
};


const getRnDHistory = async (req, res) => {
  try {
    const { projectId } = req.query;
    const { sortField = 'date', sortOrder = 'desc' } = req.query; // Extract sort parameters with defaults

    // Validate request
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Step 1: Get R&D history data
    const assessmentRows = await projectQueries.getRnDHistoryData(projectId);

    // Step 2: Iterate through each row and fetch the related assessment details
    const result = [];
    for (let row of assessmentRows) {
      const assessmentId = row.id;
      const detailsRows = await projectQueries.getAssessmentDetails(assessmentId);

      if (detailsRows.length > 0) {
        const referenceData = detailsRows[0].reference;
        // Save whatever is in the reference field into content
        let content = referenceData;
        // Set type to fuzzy logic
        let type = 'fuzzy logic';

        result.push({
          id: detailsRows[0].id, // Include the id from the details query
          type: type || 'Unknown Source',
          date: new Date(row.createdtime).toISOString().split('T')[0],
          content,
          rd_score: parseFloat(row.rd_score), // Ensure rd_score is a number for sorting
        });
      }
    }

    // Step 3: Apply sorting
    if (sortField && ['type', 'date', 'rd_score'].includes(sortField)) {
      result.sort((a, b) => {
        if (sortField === 'date') {
          return sortOrder === 'asc'
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date);
        } else if (sortField === 'type') {
          const valA = a.type.toLowerCase();
          const valB = b.type.toLowerCase();
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        } else if (sortField === 'rd_score') {
          return sortOrder === 'asc' ? a.rd_score - b.rd_score : b.rd_score - a.rd_score;
        }
        return 0;
      });
    }

    // Step 4: Add sequence number
    const resultWithSequence = result.map((item, index) => ({
      sequence_no: index + 1, // Sequence number starting from 1
      ...item,
    }));

    // Send the response
    return res.json(resultWithSequence);
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ message: 'Error fetching R&D history', error });
  }
};
const getRnDContentBySequence = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate query parameters
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }

    // Fetch assessment details using the ID
    const detailsRows = await projectQueries.getAssessmentDetailsById(id);

    if (!detailsRows || detailsRows.length === 0) {
      return res.status(404).json({ message: 'No details found for the given ID' });
    }

    const referenceData = detailsRows[0].reference;
    // Save whatever is in the reference field into content
    let content = referenceData;
    // Set type to fuzzy logic
    let type = 'fuzzy logic';

    // If content is not found
    if (!content) {
      return res.status(404).json({ message: 'No content found for the given ID' });
    }


    // Build the response
    const result = {
      id: detailsRows[0].id,
      type: type || 'Unknown Source',
      content,
    };

    // Send the response
    return res.json(result);
  } catch (error) {
    console.error('Error fetching content by sequence:', error);
    return res.status(500).json({ message: 'Error fetching content', error });
  }
};

const sampleProjectSheet = async (req, res) => {
  try {
    const filePath = await projectSampleSheet();

    // Set headers for Excel file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="ProjectSampleSheet.xlsx"');

    // Read the file and pipe it to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up the file after download (optional)
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete temporary file:", err);
      });
    });
  } catch (error) {
    return res.status(500).json(new ApiError(error.message, 500, error));
  }
};


const getCCEmails = async (req, res) => {
  try {

    const { projectId } = req.params;
    const { purpose } = req.query;

    if (!projectId) {
      return res.status(400).json(new ApiError("Invalid or missing projectId", 400));
    }
    if (!purpose || !["SURVEY", "INTERACTION"].includes(purpose.toUpperCase())) {
      return res.status(400).json(new ApiError("Invalid purpose. Must be 'SURVEY' or 'INTERACTION'", 400));
    }

    const ccmails = await projectQueries.getCCEmailsByProjectId(projectId, purpose);
    return res.status(200).json(new ApiResponse({ ccmails }, "CC mails fetched successfully", true));
  } catch (error) {
    console.error(`Error fetching cc mails for project ${projectId}:`, error.message);
    return res.status(500).json(new ApiError(error.message, 500));
  }
};


const updateCCEmails = async (req, res) => {
  try {

    const { projectId } = req.params;
    const { purpose } = req.query;
    const { emails } = req.body;

    if (!projectId) {
      return res.status(400).json(new ApiError("Invalid or missing project Id", 400));
    }
    if (!purpose || !["SURVEY", "INTERACTION"].includes(purpose.toUpperCase())) {
      return res.status(400).json(new ApiError("Invalid purpose. Must be 'SURVEY' or 'INTERACTION'", 400));
    }
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json(new ApiError("Emails must be a non-empty array", 400));
    }

    const success = await projectQueries.updateCCEmailsByProjectId(projectId, purpose.toUpperCase(), emails);

    if (!success) {
      return res.status(404).json(new ApiError("Project not found or no changes made", 404));
    }

    return res.status(200).json(new ApiResponse({}, "ccEmails updated successfully", true));
  } catch (error) {
    console.error(`Error updating ccEmails for project ${projectId}:`, error.message);
    return res.status(500).json(new ApiError("Internal Server Error", 500));
  }
};


module.exports = {
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
};
