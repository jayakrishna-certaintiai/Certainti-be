const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");
const Project = require("../models/project.model");
const TeamMember = require("../models/project-team.model");
const ProjectMilestones = require("../models/project-milestones.model");
const createConstantValueArray = require("../utils/addConstantToArray");
const MasterSurvey = require("../models/master-survey.model");
const surveyQueries = require("../queries/survey.queries");
const caseQueries = require("../queries/case.queries");

const projectQueries = {

  getProjectFiledOptions: async function () {
    try {
      const sqlQuery = `
          SELECT 
              field,
              GROUP_CONCAT(status ORDER BY sequence SEPARATOR ',') AS status
          FROM (
              SELECT 
                  field,
                  status,
                  sequence
              FROM 
                  system_status
              WHERE 
                  object = 'projects'
              ORDER BY 
                  field, sequence
          ) AS ordered_statuses
          GROUP BY 
              field;
      `;

      const optionsData = await sequelize.query(sqlQuery, { type: Sequelize.QueryTypes.SELECT });

      const data = {};
      for (const record of optionsData) {
        data[record.field] = record.status.split(',').map(item => item.trim());
      }

      return data;

    } catch (error) {
      console.log("Error fetching projects filed options list : ", error);
      throw error;
    }
  },

  projectFilterValues: async function (filter) {
    try {

      let joinsList = [];
      let whereConditionsList = [];
      let selectItemsList = [];

      const { caseId } = filter;

      if (caseId) {
        let caseIdJoin = `master_case_project ON master_case_project.projectid = projects.projectId`;
        let caseIdCondition = `master_case_project.caseid = '${caseId}'`;
        joinsList.push(caseIdJoin);
        whereConditionsList.push(caseIdCondition);
        selectItemsList.push('projects.projectId');
        selectItemsList.push('projects.projectCode');
        selectItemsList.push('projects.projectName');
        selectItemsList.push('master_case_project.spocname');
        selectItemsList.push('master_case_project.spocemail');
      }

      let data = {};

      const projectOptionsQuery = `
          SELECT 
              field,
              GROUP_CONCAT(status ORDER BY sequence SEPARATOR ',') AS status
          FROM (
              SELECT 
                  field,
                  status,
                  sequence
              FROM 
                  system_status
              WHERE 
                  object = 'projects'
              ORDER BY 
                  field, sequence
          ) AS ordered_statuses
          GROUP BY 
              field;
      `;

      let whereQuery = whereConditionsList.length > 0 ? 'WHERE ' + whereConditionsList.join(' AND ') : '';
      let joinQuery = joinsList.length > 0 ? ' JOIN ' + joinsList.join(' JOIN ') : '';
      let selectQuery = selectItemsList.length > 0 ? ',' + selectItemsList.join(',') : '';

      const projectDataQuery = `
          SELECT
            projects.spocName,
            projects.spocEmail,
            company.fiscalYear,
            projects.s_last_updated_by
            ${selectQuery}
          FROM
            projects
          JOIN company ON company.companyId = projects.companyId
          ${joinQuery}
          ${whereQuery}
      `;

      let optionsData = await sequelize.query(projectOptionsQuery, { type: Sequelize.QueryTypes.SELECT });
      let projectData = await sequelize.query(projectDataQuery, { type: Sequelize.QueryTypes.SELECT });

      for (let reocrd of optionsData) {
        data[reocrd.field] = reocrd.status.split(',');
      }

      const spocNames = [...new Set(projectData.map(item => item.spocName).filter(name => name !== null))];
      const spocEmails = [...new Set(projectData.map(item => item.spocEmail).filter(email => email !== null))];
      const fiscalYears = [...new Set(projectData.map(item => item.fiscalYear).filter(fiscalYear => fiscalYear !== null))];
      const lastUpdatedBys = [...new Set(projectData.map(item => item.s_last_updated_by).filter(s_last_updated_by => s_last_updated_by !== null))];

      //for case
      const projectIds = [...new Set(projectData.map(item => item.projectId).filter(projectId => projectId !== null))];
      const projectCodes = [...new Set(projectData.map(item => item.projectCode).filter(projectCode => projectCode !== null))];
      const projectNames = [...new Set(projectData.map(item => item.projectName).filter(projectName => projectName !== null))];
      const caseSpocNames = [...new Set(projectData.map(item => item.spocname).filter(spocname => spocname !== null))];
      const caseSpocEmails = [...new Set(projectData.map(item => item.spocemail).filter(spocemail => spocemail !== null))];


      const surveyStatuses = ['NOT SENT', 'SENT', 'REMINDER SENT', 'RESPONSE RECEIVED'];

      data.spocNames = spocNames;
      data.spocEmails = spocEmails;
      data.fiscalYears = fiscalYears;
      data.surveyStatuses = surveyStatuses;
      data.lastUpdatedBys = lastUpdatedBys;

      //for case
      if (caseId) {
        data.projectIds = projectIds;
        data.projectCodes = projectCodes;
        data.projectNames = projectNames;
        data.spocNames = caseSpocNames;
        data.spocEmails = caseSpocEmails;
      }

      return data;

    } catch (error) {
      console.log("Error fetching projects filters list : ", error);
      throw error;
    }
  },

  getProjectFilterValues: async function (filter) {
    try {

      const { caseId, companyId, timesheetId, contactId } = filter;

      let whereConditions = [];
      let joins = [];
      let selects = [];

      let whereQuery = '';
      let joinQuery = '';
      let selectQuery = '';

      if (companyId) {
        let companyIdCondition = `projects.companyId = '${companyId}'`;
        whereConditions.push(companyIdCondition);
      }

      if (timesheetId) {
        let timesheetIdJoin = `timesheettasks ON timesheettasks.projectId = projects.projectId`;
        let timesheetIdCondition = `timesheettasks.timesheetId = '${timesheetId}'`;
        joins.push(timesheetIdJoin);
        whereConditions.push(timesheetIdCondition);
      }

      if (caseId) {
        let caseIdJoin = `master_case_project ON master_case_project.projectid = projects.projectId`;
        let caseIdCondition = `master_case_project.caseid = '${caseId}'`;
        joins.push(caseIdJoin);
        whereConditions.push(caseIdCondition);
      }

      if (contactId) {
        let contactIdCondition = `teammembers.contactId = '${contactId}'`;
        whereConditions.push(contactIdCondition)
        let contactIdJoin = `teammembers ON teammembers.projectId = projects.projectId`;
        joins.push(contactIdJoin);
        selects.push('teammembers.projectRole');
      }

      //selects
      if (caseId) {
        selects.push('master_case_project.spocname AS spocName', 'master_case_project.spocemail AS spocEmail');
      }
      else {
        selects.push('projects.spocName', 'projects.spocEmail');
      }


      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      joinQuery = joins.length > 0 ? ' JOIN ' + joins.join(' JOIN ') : '';
      selectQuery = selects.length > 0 ? selects.join(',') : '';

      const projectDataQuery = `
          SELECT
              projects.projectId,
              projects.projectCode,
              projects.projectName,
              projects.accountingYear AS fiscalYear,
              ${selectQuery}
          FROM
              projects
          ${joinQuery}
          ${whereQuery};
      `;

      const projectData = await sequelize.query(projectDataQuery, { type: Sequelize.QueryTypes.SELECT });

      let projectIdSet = new Set();
      let projectCodeSet = new Set();
      let projectNameSet = new Set();
      let fiscalYearSet = new Set();
      let spocNameSet = new Set();
      let spocEmailSet = new Set();
      let projectRoleSet = new Set();

      for (const obj of projectData) {
        if (obj.projectId) projectIdSet.add(obj.projectId);
        if (obj.projectCode) projectCodeSet.add(obj.projectCode);
        if (obj.projectName) projectNameSet.add(obj.projectName);
        if (obj.fiscalYear) fiscalYearSet.add(obj.fiscalYear);
        if (obj.spocName) spocNameSet.add(obj.spocName);
        if (obj.spocEmail) spocEmailSet.add(obj.spocEmail);
        if (obj.projectRole) projectRoleSet.add(obj.projectRole);
      }

      const projectIds = Array.from(projectIdSet).sort();
      const projectCodes = Array.from(projectCodeSet).sort();
      const projectNames = Array.from(projectNameSet).sort();
      const fiscalYears = Array.from(fiscalYearSet).sort();
      const spocNames = Array.from(spocNameSet).sort();
      const spocEmails = Array.from(spocEmailSet).sort();
      const projectRoles = Array.from(projectRoleSet);

      return { projectIds, projectCodes, projectNames, fiscalYears, spocNames, spocEmails, projectRoles };

    } catch (error) {
      console.log("Error fetching projects filters list : ", error);
      throw error;
    }
  },

  getSummaryFilterValues: async function (filter) {
    try {
      const { caseId, projectId } = filter;

      let joinQuery = '';
      let whereQuery = '';

      if (caseId) {
        joinQuery = `
            JOIN
                (
                    SELECT
                          DISTINCT projectId
                    FROM
                          master_project_ai_summary
                ) AS summaryProjects ON summaryProjects.projectId = projects.projectId
          `;

        whereQuery = `
            WHERE
                  summaryProjects.projectId IN
                  (
                        SELECT
                                master_case_project.projectid
                        FROM
                                master_case_project
                        WHERE
                                master_case_project.caseid = '${caseId}'
                      );
        `;
      } else if (projectId) {
        whereQuery = `WHERE master_project_ai_summary.projectId = '${projectId}'`
      }

      const projectDataQuery = `
             SELECT
                  projects.projectId,
                  projects.projectCode,
                  projects.projectName
            FROM
                  projects
            ${joinQuery}
            ${whereQuery};
      `;


      const projectData = await sequelize.query(projectDataQuery, { type: Sequelize.QueryTypes.SELECT });
      let projectIds = [];
      let projectCodes = [];
      let projectNames = [];
      for (const obj of projectData) {
        projectIds.push(obj.projectId);
        projectCodes.push(obj.projectCode);
        projectNames.push(obj.projectName);
      }

      const summaryStatus = ['active', 'inactive'];

      const data = {};

      if (caseId) {
        return {
          caseProjectIds: projectIds,
          caseProjectCodes: projectCodes,
          caseProjectNames: projectNames,
          summaryStatus: summaryStatus
        };
      }

      return {
        projectIds,
        projectCodes,
        projectNames,
        summaryStatus
      }

    } catch (error) {
      console.log("Error fetching Summary filters list : ", error);
      throw error;
    }
  },

  getInteractionFilterValues: async function (filter) {
    try {

      const { caseId, projectId } = filter;

      let whereConditions = [];
      let joins = [];

      let whereQuery = '';
      let joinQuery = '';

      if (projectId) {
        const projectIdCondition = `projects.projectId = '${projectId}'`;
        whereConditions.push(projectIdCondition);
      }

      if (caseId) {
        const caseIdCondition = `master_case_project.caseid = '${caseId}'`;
        whereConditions.push(caseIdCondition);

        const caseIdJoin = `master_case_project ON master_case_project.projectid = master_interactions.projectIdentifier`;
        joins.push(caseIdJoin);
      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      joinQuery = joins.length > 0 ? ' JOIN ' + joins.join(' JOIN ') : '';

      const interactionDataQuery = `
          SELECT
              projects.projectId,
              projects.projectCode,
              projects.projectName,
              master_interactions.spocemail AS spocEmail
          FROM
              master_interactions
          JOIN
              projects ON projects.projectId = master_interactions.projectIdentifier
          ${joinQuery}
          ${whereQuery}
      `;

      const interactionData = await sequelize.query(interactionDataQuery, { type: Sequelize.QueryTypes.SELECT });

      const interactionStatus = ['NOT SENT', 'SENT', 'REMINDER SENT', 'RESPONSE RECEIVED'];

      let projectIdSet = new Set();
      let projectCodeSet = new Set();
      let projectNameSet = new Set();
      let spocEmailSet = new Set();

      for (const record of interactionData) {
        if (record.projectId) projectIdSet.add(record.projectId);
        if (record.projectCode) projectCodeSet.add(record.projectCode);
        if (record.projectName) projectNameSet.add(record.projectName);
        if (record.spocEmail) spocEmailSet.add(record.spocEmail);
      }

      const projectIds = Array.from(projectIdSet).sort();
      const projectCodes = Array.from(projectCodeSet).sort();
      const projectNames = Array.from(projectNameSet).sort();
      const sentToEmails = Array.from(spocEmailSet).sort();

      if (caseId) {
        return {
          caseProjectIds: projectIds,
          caseProjectCodes: projectCodes,
          caseProjectNames: projectNames,
          sentToEmails: sentToEmails,
          interactionStatus: interactionStatus
        }
      }

      return { projectIds, projectCodes, projectNames, sentToEmails, interactionStatus };

    } catch (error) {
      console.log("Error fetching Interactions filter values : ", error);
      throw error;
    }
  },

  getTeamFilterValues: async function (filter) {
    try {

      const { projectId } = filter;

      let whereConditions = [];
      let whereQuery = '';

      if (projectId) {
        let projectIdCondition = `teammembers.projectId = '${projectId}'`;
        whereConditions.push(projectIdCondition);
      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      const teamDataQuery = `
        SELECT
            contacts.firstName AS name,
            teammembers.projectRole
        FROM
            teammembers
        JOIN
            contacts ON contacts.contactId = teammembers.contactId
        ${whereQuery};
      `;

      const teamData = await sequelize.query(teamDataQuery, { type: Sequelize.QueryTypes.SELECT });

      let nameSet = new Set();
      let projectRoleSet = new Set();

      for (const record of teamData) {
        if (record.name) nameSet.add(record.name);
        if (record.projectRole) projectRoleSet.add(record.projectRole);
      }

      const names = Array.from(nameSet).sort();
      const projectRoles = Array.from(projectRoleSet).sort();

      return { names, projectRoles };

    } catch (error) {
      console.log("Error fetching Team filter values : ", error);
      throw error;
    }
  },

  getProjectsList: async function (sort, filters, others) {
    try {

      let whereConditionsList = [];
      let whereQuery = ``;
      let selectItemsList = [];
      let joinQuery = ``;
      let selectQuery = ``;

      //case
      const { caseId, caseCompanyId } = others;
      if (caseId && caseCompanyId) {
        joinQuery += `
        LEFT JOIN
          master_case_project on master_case_project.projectid = projects.projectId AND master_case_project.caseid = '${caseId}'
        `;

        selectItemsList.push(`CASE WHEN master_case_project.caseid = '${caseId}' THEN TRUE ELSE FALSE END AS already_added`);

        let caseCompanyIdCondition = `projects.companyId = '${caseCompanyId}'`;
        whereConditionsList.push(caseCompanyIdCondition);
      } else if (caseId) {
        joinQuery += `
          JOIN
            master_case_project on master_case_project.projectid = projects.projectId
          `;

        selectItemsList.push('master_case_project.caseid');
        selectItemsList.push('master_case_project.spocname AS spocName');
        selectItemsList.push('master_case_project.spocemail AS spocEmail');
        selectItemsList.push('master_case_project.oldspocname AS oldSpocName');
        selectItemsList.push('master_case_project.oldspocemail AS oldSpocEmail');

        let caseIdCondition = `master_case_project.caseid = '${caseId}' `;
        whereConditionsList.push(caseIdCondition);
      }

      //sort
      const sortHelper = {
        projectIdentifier: {
          originalName: "projects.projectIdentifier",
          sortMessage: "Project Identifier"
        },
        projectId: {
          originalName: "projects.projectId",
          sortMessage: "Project ID"
        },
        projectCode: {
          originalName: "projects.projectCode",
          sortMessage: "Project Code"
        },
        projectName: {
          originalName: "projects.projectName",
          sortMessage: "Project Name"
        },
        description: {
          originalName: "projects.description",
          sortMessage: "Description"
        },
        spocName: {
          originalName: "projects.spocName",
          sortMessage: "SPOC Name"
        },
        spocEmail: {
          originalName: "projects.spocEmail",
          sortMessage: "SPOC Email"
        },
        oldSpocName: {
          originalName: "projects.oldSpocName",
          sortMessage: "Old SPOC Name"
        },
        oldSpocEmail: {
          originalName: "projects.oldSpocEmail",
          sortMessage: "Old SPOC Email"
        },
        s_project_status: {
          originalName: "projects.s_project_status",
          sortMessage: "Project Status"
        },
        s_fte_cost: {
          originalName: "projects.s_fte_cost",
          sortMessage: "FTE Cost"
        },
        s_subcon_cost: {
          originalName: "projects.s_subcon_cost",
          sortMessage: "Subcon Cost"
        },
        s_total_project_cost: {
          originalName: "(COALESCE(projects.s_fte_cost, 0) + COALESCE(projects.s_subcon_cost, 0))",
          sortMessage: "Total Project Cost"
        },
        s_fte_hours: {
          originalName: "projects.s_fte_hours",
          sortMessage: "FTE Hours"
        },
        s_subcon_hours: {
          originalName: "projects.s_subcon_hours",
          sortMessage: "Subcon Hours"
        },
        s_total_hours: {
          originalName: "projects.s_fte_hours + projects.s_subcon_hours",
          sortMessage: "Total Hours"
        },
        s_rnd_adjustment: {
          originalName: "projects.s_rnd_adjustment",
          sortMessage: "QRE Adjustment"
        },
        s_fte_qre_cost: {
          originalName: "projects.s_fte_qre_cost",
          sortMessage: "FTE QRE Cost"
        },
        s_subcon_qre_cost: {
          originalName: "projects.s_subcon_qre_cost",
          sortMessage: "Subcon QRE Cost"
        },
        s_qre_cost: {
          originalName: "(COALESCE(projects.s_fte_qre_cost, 0) + COALESCE(projects.s_subcon_qre_cost, 0))",
          sortMessage: "QRE Cost"
        },
        s_rd_credits: {
          originalName: "projects.s_rd_credits",
          sortMessage: "R&D Credits"
        },
        s_data_gathering: {
          originalName: "projects.s_data_gathering",
          sortMessage: "Data Gathering Status"
        },
        s_pending_data: {
          originalName: "projects.s_pending_data",
          sortMessage: "Pending Data Status"
        },
        s_timesheet_status: {
          originalName: "projects.s_timesheet_status",
          sortMessage: "Timesheet Status"
        },
        s_fte_cost_status: {
          originalName: "projects.s_fte_cost_status",
          sortMessage: "FTE Cost Status"
        },
        s_subcon_cost_status: {
          originalName: "projects.s_subcon_cost_status",
          sortMessage: "Subcon Cost Status"
        },
        s_technical_interview_status: {
          originalName: "projects.s_technical_interview_status",
          sortMessage: "Technical Interview Status"
        },
        s_technical_summary_status: {
          originalName: "projects.s_technical_summary_status",
          sortMessage: "Technical Summary Status"
        },
        s_financial_summary_status: {
          originalName: "projects.s_financial_summary_status",
          sortMessage: "Financial Summary Status"
        },
        s_claims_form_status: {
          originalName: "projects.s_claims_form_status",
          sortMessage: "Claims Form Status"
        },
        s_final_review_status: {
          originalName: "projects.s_final_review_status",
          sortMessage: "Final Review Status"
        },
        s_interaction_status: {
          originalName: "projects.s_interaction_status",
          sortMessage: "Interaction Status"
        },
        s_last_updated_by: {
          originalName: "projects.s_last_updated_by",
          sortMessage: "Last Updated By"
        },
        s_last_updated_timestamp: {
          originalName: "projects.s_last_updated_timestamp",
          sortMessage: "Last Updated Timestamp"
        },
        s_notes: {
          originalName: "projects.s_notes",
          sortMessage: "Notes"
        },
        projectType: {
          originalName: "projects.projectType",
          sortMessage: "Project Type"
        },
        s_rnd_status: {
          originalName: "projects.s_rnd_status",
          sortMessage: "R&D Status"
        },
        rndPotential: {
          originalName: "rnd.rd_score",
          sortMessage: "R&D Potential"
        },
        rndFinal: {
          originalName: "COALESCE(rnd.rd_score, 0) + COALESCE(projects.s_rnd_adjustment, 0)",
          sortMessage: "Final R&D Score"
        },
        surveyStatus: {
          originalName: "surveyDetails.surveyStatus",
          sortMessage: "Survey Status"
        },
        surveySentDate: {
          originalName: "surveyDetails.surveySentDate",
          sortMessage: "Survey Sent Date"
        },
        reminderSentDate: {
          originalName: "surveyDetails.reminderSentDate",
          sortMessage: "Reminder Sent Date"
        },
        surveyResponseDate: {
          originalName: "surveyDetails.surveyResponseDate",
          sortMessage: "Survey Response Date"
        },
        companyId: {
          originalName: "company.companyId",
          sortMessage: "Company ID"
        },
        companyName: {
          originalName: "company.companyName",
          sortMessage: "Company Name"
        },
        fiscalYear: {
          originalName: "company.fiscalYear",
          sortMessage: "Fiscal Year"
        }
      };

      let orderQuery = `ORDER BY projects.s_last_updated_timestamp DESC`;
      let appliedSort = 'Last Updated Descending';

      const { sortField, sortOrder } = sort;

      if (sortField && sortOrder) {
        if (sortField in sortHelper) {
          orderQuery = `ORDER BY ${sortHelper[sortField].originalName}`;
          orderQuery = sortOrder == 'dsc' ? orderQuery + ' DESC' : orderQuery;
          appliedSort = sortHelper[sortField].sortMessage;
          appliedSort = sortOrder == 'dsc' ? appliedSort + ' descending' : appliedSort + ' ascending';
        }
      }


      //filter
      const filterHelper = {
        projectIdentifiers: {
          originalName: "projects.projectIdentifier",
          filterMessage: "Project Identifier",
          dataType: "text"
        },
        projectIds: {
          originalName: "projects.projectId",
          filterMessage: "Project Id",
          dataType: "text"
        },
        projectCodes: {
          originalName: "projects.projectCode",
          filterMessage: "Project Code",
          dataType: "text"
        },
        projectNames: {
          originalName: "projects.projectName",
          filterMessage: "Project Name",
          dataType: "text"
        },
        spocNames: {
          originalName: "projects.spocName",
          filterMessage: "SPOC Name",
          dataType: "text"
        },
        spocEmails: {
          originalName: "projects.spocEmail",
          filterMessage: "SPOC Email",
          dataType: "text"
        },
        projectTypes: {
          originalName: "projects.projectType",
          filterMessage: "Project Type",
          dataType: "text"
        },

        companyIds: {
          originalName: "company.companyId",
          filterMessage: "Company ID",
          dataType: "text"
        },
        companyNames: {
          originalName: "company.companyName",
          filterMessage: "Company Name",
          dataType: "text"
        },
        fiscalYears: {
          originalName: "company.fiscalYear",
          filterMessage: "Fiscal Year",
          dataType: "text"
        },

        projectStatuses: {
          originalName: "projects.s_project_status",
          filterMessage: "Project Status",
          dataType: "text"
        },
        dataGatherings: {
          originalName: "projects.s_data_gathering",
          filterMessage: "Data Gathering",
          dataType: "text"
        },
        pendingDatas: {
          originalName: "projects.s_pending_data",
          filterMessage: "Pending Data",
          dataType: "text"
        },
        timesheetStatuses: {
          originalName: "projects.s_timesheet_status",
          filterMessage: "Timesheet Status",
          dataType: "text"
        },
        fteCostStatuses: {
          originalName: "projects.s_fte_cost_status",
          filterMessage: "FTE Cost Status",
          dataType: "text"
        },
        subconCostStatuses: {
          originalName: "projects.s_subcon_cost_status",
          filterMessage: "Subcon Cost Status",
          dataType: "text"
        },
        technicalInterviewStatuses: {
          originalName: "projects.s_technical_interview_status",
          filterMessage: "Technical Interview Status",
          dataType: "text"
        },
        technicalSummaryStatuses: {
          originalName: "projects.s_technical_summary_status",
          filterMessage: "Technical Summary Status",
          dataType: "text"
        },
        financialSummaryStatuses: {
          originalName: "projects.s_financial_summary_status",
          filterMessage: "Financial Summary Status",
          dataType: "text"
        },
        claimsFormStatuses: {
          originalName: "projects.s_claims_form_status",
          filterMessage: "Claims Form Status",
          dataType: "text"
        },
        finalReviewStatuses: {
          originalName: "projects.s_final_review_status",
          filterMessage: "Final Review Status",
          dataType: "text"
        },
        rndStatuses: {
          originalName: "projects.rnd_status",
          filterMessage: "R&D Status",
          dataType: "text"
        },
        surveyStatuses: {
          originalName: "COALESCE(surveyDetails.surveyStatus, 'NOT SENT')",
          filterMessage: "Survey Status",
          dataType: "text"
        },
        interactionStatuses: {
          originalName: "projects.s_interaction_status",
          filterMessage: "Interaction Status",
          dataType: "text"
        },
        lastUpdatedBys: {
          originalName: "projects.s_last_updated_by",
          filterMessage: "Last Updated By",
          dataType: "text"
        },

        rndCredits: {
          originalName: "projects.s_rd_credits",
          filterMessage: "R&D Credits",
          dataType: "number"
        },
        fteCosts: {
          originalName: "projects.s_fte_cost",
          filterMessage: "FTE Cost",
          dataType: "number"
        },
        subconCosts: {
          originalName: "projects.s_subcon_cost",
          filterMessage: "Subcon Cost",
          dataType: "number"
        },
        totalProjectCosts: {
          originalName: "(projects.s_fte_cost + projects.s_subcon_cost)",
          filterMessage: "Total Project Cost",
          dataType: "number"
        },
        FTEhours: {
          originalName: "projects.s_fte_hours",
          filterMessage: "FTE Hours",
          dataType: "number"
        },
        SubconHours: {
          originalName: "projects.s_subcon_hours",
          filterMessage: "Subcon Hours",
          dataType: "number"
        },
        TotalHours: {
          originalName: "projects.s_fte_hours + projects.s_subcon_hours",
          filterMessage: "Total Hours",
          dataType: "number"
        },
        rndAdjustments: {
          originalName: "projects.s_rnd_adjustment",
          filterMessage: "R&D Adjustment",
          dataType: "number"
        },
        fteQreCosts: {
          originalName: "projects.s_fte_qre_cost",
          filterMessage: "FTE QRE Cost",
          dataType: "number"
        },
        subconQreCosts: {
          originalName: "projects.s_subcon_qre_cost",
          filterMessage: "Subcon QRE Cost",
          dataType: "number"
        },
        qreCosts: {
          originalName: "(COALESCE(projects.s_fte_qre_cost, 0) + COALESCE(projects.s_subcon_qre_cost, 0))",
          filterMessage: "QRE Cost",
          dataType: "number"
        },
        rndPotentials: {
          originalName: "rnd.rd_score",
          filterMessage: "R&D Potential",
          dataType: "number"
        },
        rndFinals: {
          originalName: "(COALESCE(rnd.rd_score, 0) + COALESCE(projects.s_rnd_adjustment, 0))",
          filterMessage: "R&D Final",
          dataType: "number"
        },

        lastUpdatedTimestamps: {
          originalName: "projects.s_last_updated_timestamp",
          filterMessage: "Last Updated Date",
          dataType: "date"
        },
        surveySentDates: {
          originalName: "surveyDetails.surveySentDate",
          filterMessage: "Survey Sent Date",
          dataType: "date"
        },
        reminderSentDates: {
          originalName: "surveyDetails.reminderSentDate",
          filterMessage: "Reminder Sent Date",
          dataType: "date"
        },
        surveyResponseDates: {
          originalName: "surveyDetails.surveyResponseDate",
          filterMessage: "Survey Response Date",
          dataType: "date"
        }
      }

      let appliedFiltersList = [];
      let appliedFilter = ``;

      for (const filter in filters) {
        if (filter in filterHelper && filters[filter]) {
          const helper = filterHelper[filter];
          const dataType = helper.dataType;
          const originalName = helper.originalName;
          const filterMessage = helper.filterMessage;

          let condition = ``;

          if (dataType == 'text') {
            condition = `${originalName} in ('${filters[filter].join("', '")}')`;
          }

          if (dataType == 'number') {
            condition = `${originalName} >= ${filters[filter][0] ? filters[filter][0] : 0} AND ${originalName} <= ${filters[filter][1] ? filters[filter][1] : Number.MAX_SAFE_INTEGER} `;
          }

          if (dataType == 'date') {
            const startDate = `${filters[filter][0]} 00:00:00`;
            const endDate = `${filters[filter][1]} 23:59:59`;

            const earliestDate = "0000-01-01 00:00:00";
            const latestDate = "9999-12-31 23:59:59";

            condition = `${originalName} BETWEEN "${filters[filter][0] ? startDate : earliestDate}" AND "${filters[filter][1] ? endDate : latestDate}"`;
          }

          whereConditionsList.push(condition);
          appliedFiltersList.push(filterMessage);
        }
      }

      whereQuery = whereConditionsList.length > 0 ? 'WHERE ' + whereConditionsList.join(" AND ") : '';
      appliedFilter = appliedFiltersList.length > 0 ? appliedFiltersList.join(', ') : 'None';
      selectQuery = selectItemsList.length > 0 ? ',' + selectItemsList.join(',') : '';


      const projectsListQuery = `
          SELECT
            projects.projectIdentifier,
            projects.projectId,
            projects.projectCode,
            projects.projectName,
            projects.description,
            projects.spocName,
            projects.spocEmail,
            projects.oldSpocName,
            projects.oldSpocEmail,
            projects.s_project_status,
            projects.s_fte_cost,
            projects.s_subcon_cost,
            COALESCE(projects.s_fte_cost, 0) + COALESCE(projects.s_subcon_cost, 0) AS s_total_project_cost,
            projects.s_fte_hours,
            projects.s_subcon_hours,
            COALESCE(projects.s_fte_hours, 0) + COALESCE(projects.s_subcon_hours, 0) AS s_total_hours,
            projects.s_rnd_adjustment,
            projects.s_fte_qre_cost,
            projects.s_subcon_qre_cost,
            projects.s_rd_credits,
            COALESCE(projects.s_fte_qre_cost, 0) + COALESCE(projects.s_subcon_qre_cost, 0) AS s_qre_cost,
            projects.s_data_gathering,
            projects.s_pending_data,
            projects.s_timesheet_status,
            projects.s_fte_cost_status,
            projects.s_subcon_cost_status,
            projects.s_technical_interview_status,
            projects.s_technical_summary_status,
            projects.s_financial_summary_status,
            projects.s_claims_form_status,
            projects.s_final_review_status,
            projects.s_interaction_status,
            projects.s_last_updated_by,
            projects.s_last_updated_timestamp,
            projects.s_notes,
            projects.projectType,
            projects.s_rnd_status,
            rnd.rd_score AS rndPotential,
            COALESCE(rnd.rd_score, 0) + COALESCE(projects.s_rnd_adjustment, 0) AS rndFinal,
            COALESCE(surveyDetails.surveyStatus, 'NOT SENT') AS surveyStatus,
            surveyDetails.surveySentDate,
            surveyDetails.reminderSentDate,
            surveyDetails.surveyResponseDate,
            company.companyId,
            company.companyName,
            company.fiscalYear,
            company.currency,
            company.currencySymbol,
            company.fteMultiplier,
            company.subconMultiplier
            ${selectQuery}
        FROM
            projects
        LEFT JOIN 
            company ON projects.companyId = company.companyId
        LEFT JOIN
            (
                SELECT 
                    mp.projectId,
                    mp.rd_score
                FROM 
                    master_project_ai_assessment mp
                WHERE 
                    mp.status = 'active'
            ) rnd ON rnd.projectId = projects.projectIdentifier
        LEFT JOIN
            (
                SELECT
                    mcp.projectid,
                    ss.status AS surveyStatus,
                    ms.closeDate AS surveyResponseDate,
                    ms.modifiedtime AS reminderSentDate,
                    ms.createdtime AS surveySentDate
                FROM
                    master_case_project mcp
                JOIN
                    master_survey_assignment msa ON msa.caseprojectid = mcp.id
                JOIN
                    master_survey ms ON ms.id = msa.surveyid
                JOIN
                    system_status ss ON ss.id = ms.surveystatusid
            ) surveyDetails ON surveyDetails.projectid = projects.projectId
            ${joinQuery}
            ${whereQuery}
            ${orderQuery}
      `;

      let list = await sequelize.query(projectsListQuery, {
        type: Sequelize.QueryTypes.SELECT
      });

      //remove code from here
      for (let record of list) {
        const fteCost = record.s_fte_cost;
        const subconCost = record.s_subcon_cost;
        const qreFinal = record.rndFinal / 100;
        const fteMultiplier = record.fteMultiplier;
        const subconMultiplier = record.subconMultiplier;

        if (fteCost) record.s_fte_qre_cost = fteCost * qreFinal * fteMultiplier;
        if (subconCost) record.s_subcon_qre_cost = subconCost * qreFinal * subconMultiplier;

        record.s_qre_cost = record.s_fte_qre_cost + record.s_subcon_qre_cost;
      }
      //till here

      return { list, appliedSort, appliedFilter };

    } catch (error) {
      console.log("Projects Queries : ", error);
      throw error;
    }
  },

  getProjects: async function (filter, sort, others) {
    try {

      let appliedSort = 'Last Updated ascending';
      let appliedFilterList = [];

      let whereConditions = [];
      let selectItems = [];

      let selectQuery = ``;
      let joinQuery = ``;
      let whereQuery = '';

      //filter
      const {
        projectIds,
        projectCodes,
        projectNames,
        fiscalYears,
        spocNames,
        spocEmails,

        minTotalExpense,
        maxTotalExpense,
        minRnDExpense,
        maxRnDExpense,
        minRnDPotential,
        maxRnDPotential,

        companyIds,

        caseSpocNames,
        caseSpocEmails,

      } = filter;

      if (projectIds && projectIds.length > 0) {
        const projectIdCondition = `projects.projectId in ('${projectIds.join("', '")}')`;
        whereConditions.push(projectIdCondition);
        appliedFilterList.push('Project ID');
      }

      if (projectCodes && projectCodes.length > 0) {
        const projectCodeCondition = `projects.projectCode in ('${projectCodes.join("', '")}')`;
        whereConditions.push(projectCodeCondition);
        appliedFilterList.push('Project Code');
      }

      if (projectNames && projectNames.length > 0) {
        const projectNameCondition = `projects.projectName in ('${projectNames.join("', '")}')`;
        whereConditions.push(projectNameCondition);
        appliedFilterList.push('Project Name');
      }

      if (fiscalYears && fiscalYears.length > 0) {
        const fiscalYearCondition = `projects.accountingYear in ('${fiscalYears.join("', '")}')`;
        whereConditions.push(fiscalYearCondition);
        appliedFilterList.push('Fiscal Year');
      }

      if (spocNames && spocNames.length > 0) {
        const spocNameCondition = `projects.spocName in ('${spocNames.join("', '")}')`;
        whereConditions.push(spocNameCondition);
        appliedFilterList.push('SPOC Name');
      }

      if (spocEmails && spocEmails.length > 0) {
        const spocEmailCondition = `projects.spocEmail in ('${spocEmails.join("', '")}')`;
        whereConditions.push(spocEmailCondition);
        appliedFilterList.push('SPOC Email');
      }

      if (minTotalExpense || maxTotalExpense) {
        let totalExpenseCondition = `projects.TotalExpense >= ${minTotalExpense ? minTotalExpense : 0} AND projects.TotalExpense <= ${maxTotalExpense ? maxTotalExpense : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(totalExpenseCondition);
        appliedFilterList.push('Total Expense');
      }

      if (minRnDExpense || maxRnDExpense) {
        let totalRnDExpenseCondition = `projects.totalRnDCosts >= ${minRnDExpense ? minRnDExpense : 0} AND projects.totalRnDCosts <= ${maxRnDExpense ? maxRnDExpense : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(totalRnDExpenseCondition);
        appliedFilterList.push('R&D Expense');
      }

      if (minRnDPotential || maxRnDPotential) {
        let rndPotentialCondition = `rnd.rd_score >= ${minRnDPotential ? minRnDPotential : 0} AND rnd.rd_score <= ${maxRnDPotential ? maxRnDPotential : 100} `;
        whereConditions.push(rndPotentialCondition);
        appliedFilterList.push('R&D Potential');
      }

      if (companyIds && companyIds.length > 0) {
        const companyCondition = `projects.companyId in ('${companyIds.join("', '")}')`;
        whereConditions.push(companyCondition);
        appliedFilterList.push('Account');
      }

      //case projects
      if (caseSpocNames && caseSpocNames.length > 0) {
        const caseSpocNameCondition = `master_case_project.spocname in ('${caseSpocNames.join("', '")}')`;
        whereConditions.push(caseSpocNameCondition);
        appliedFilterList.push('SPOC Name');
      }

      if (caseSpocEmails && caseSpocEmails.length > 0) {
        const caseSpocEmailCondition = `master_case_project.spocEmail in ('${caseSpocEmails.join("', '")}')`;
        whereConditions.push(caseSpocEmailCondition);
        appliedFilterList.push('SPOC Name');
      }

      //others
      const { timesheetId, caseId, caseCompanyId, contactId } = others;

      if (timesheetId) {
        joinQuery += `
        JOIN
          (
            SELECT
                  distinct projectId
              FROM
                  timesheettasks
              WHERE timesheetId = '${timesheetId}'
          ) AS timesheetSubquery ON projects.projectId = timesheetSubquery.projectId
            `;
      }

      if (caseId && caseCompanyId) {
        joinQuery += `
        LEFT JOIN
          master_case_project on master_case_project.projectid = projects.projectId AND master_case_project.caseid = '${caseId}'
        `;

        selectItems.push(`CASE WHEN master_case_project.caseid = '${caseId}' THEN TRUE ELSE FALSE END AS already_added`);

        let caseCompanyIdCondition = `projects.companyId = '${caseCompanyId}'`;
        whereConditions.push(caseCompanyIdCondition);
      } else if (caseId) {
        joinQuery += `
          JOIN
            master_case_project on master_case_project.projectid = projects.projectId
          `;

        selectItems.push('master_case_project.caseid');
        selectItems.push('master_case_project.spocname AS spocName');
        selectItems.push('master_case_project.spocemail AS spocEmail');
        selectItems.push('master_case_project.oldspocname AS oldSpocName');
        selectItems.push('master_case_project.oldspocemail AS oldSpocEmail');

        let caseIdCondition = `master_case_project.caseid = '${caseId}' `;
        whereConditions.push(caseIdCondition);
      }

      if (contactId) {
        let contactIdCondition = `teammemebers.contactId = '${contactId}'`;
        whereConditions.push(contactIdCondition);
        joinQuery += `JOIN teammembers.projectId = projects.projectId`;
        selectItems.push('teammembers.projectRole');
      }

      //sort
      const { sortField, sortOrder } = sort;

      let orderQuery = `ORDER BY projects.modifiedTime DESC `;
      if (sortField && sortOrder) {
        switch (sortField) {
          case "projectName":
            orderQuery = `ORDER BY projects.projectName `;
            appliedSort = 'Project name';
            break;
          case "projectId":
            orderQuery = `ORDER BY projects.projectId `;
            appliedSort = 'Project ID';
            break;
          case "projectCode":
            orderQuery = `ORDER BY projects.projectCode `;
            appliedSort = 'Project ID';
            break;
          case "companyName":
            orderQuery = `ORDER BY company.companyName `;
            appliedSort = 'Account';
            break;
          case "fiscalYear":
            orderQuery = `ORDER BY company.fiscalYear `;
            appliedSort = 'Fiscal Year';
            break;
          case "spocName":
            orderQuery = `ORDER BY projects.spocName `;
            appliedSort = 'SPOC Name';
            break;
          case "spocEmail":
            orderQuery = `ORDER BY projects.spocEmail `;
            appliedSort = 'SPOC Email';
            break;
          case "TotalExpense":
            orderQuery = `ORDER BY projects.totalCosts `;
            appliedSort = 'Total Expense';
            break;
          case "rndExpense":
            orderQuery = `ORDER BY projects.totalRnDCosts `;
            appliedSort = 'R&D Expense';
            break;
          case "rndPotential":
            orderQuery = `ORDER BY rnd.rd_score `;
            appliedSort = 'R&D Potential';
            break;
        }

        orderQuery = sortOrder == 'dsc' ? orderQuery + 'DESC' : orderQuery;
        appliedSort = sortOrder == 'dsc' ? appliedSort += ' descending' : appliedSort += ' ascending';
      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(" AND ") : '';

      if (selectItems.length > 0) {
        selectQuery = selectItems.join(',');
        selectQuery = ',' + selectQuery;
      }

      const sqlQuery = `
        SELECT
          projects.projectIdentifier,
          projects.projectId,
          projects.projectCode,
          projects.projectName,
          projects.spocName,
          projects.spocEmail,
          projects.oldSpocName,
          projects.oldSpocEmail,
          COALESCE(CAST(NULLIF(projects.totalCosts, '') AS SIGNED), projects.totalCosts) AS TotalExpense,
          COALESCE(CAST(NULLIF(projects.totalEfforts, '') AS SIGNED), projects.totalEfforts) AS totalEfforts,
          COALESCE(CAST(NULLIF(projects.totalCosts, '') AS SIGNED), projects.totalCosts) AS totalCosts,
          COALESCE(CAST(NULLIF(projects.totalRnDEfforts, '') AS SIGNED), projects.totalRnDEfforts) AS totalRnDEfforts,
          COALESCE(CAST(NULLIF(projects.totalRnDCosts, '') AS SIGNED), projects.totalRnDCosts) AS rndExpense,
          projects.createdTime,
          projects.modifiedTime,
          company.companyId,
          company.companyName,
          company.fiscalYear,
          company.currency,
          company.currencySymbol,
          rnd.rd_score AS rndPotential,
          surveyDetails.surveyStatus
          ${selectQuery}
        FROM
          projects
        LEFT JOIN 
          company ON projects.companyId = company.companyId
        LEFT JOIN
          (
            SELECT 
              master_project_ai_assessment.projectId,
              master_project_ai_assessment.rd_score
            FROM 
              master_project_ai_assessment
            INNER JOIN(
              SELECT 
                projectId,
                MAX(createdtime) AS latest_created
              FROM 
                master_project_ai_assessment
              GROUP BY 
                projectId
            ) AS latest_projects ON
                  master_project_ai_assessment.projectId = latest_projects.projectId
                  AND master_project_ai_assessment.createdtime = latest_projects.latest_created
          ) AS rnd ON rnd.projectId = projects.projectIdentifier
          LEFT JOIN
              (
                  SELECT
                      master_case_project.projectid,
                      system_status.status AS surveyStatus
                  FROM
                      master_case_project
                  JOIN
                      master_survey_assignment ON master_survey_assignment.caseprojectid = master_case_project.id
                  JOIN
                      master_survey ON master_survey.id = master_survey_assignment.surveyid
                  JOIN
                      system_status ON system_status.id = master_survey.surveystatusid
              ) AS surveyDetails ON surveyDetails.projectid = projects.projectId
          ${joinQuery}
          ${whereQuery}
          ${orderQuery}
        `;


      let appliedFilter = appliedFilterList.length > 0 ? appliedFilterList.join(',') : 'None';

      const list = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT
      });

      return { list, appliedSort, appliedFilter };

    } catch (error) {
      console.log("Error fetching projects: ", error);
      throw error;
    }
  },

  getSummaryList: async function (filter, sort) {
    try {

      const {
        caseId,
        projectId,
        caseProjectIds,
        caseProjectCodes,
        caseProjectNames,
        createdOnStartDate,
        createdOnEndDate,
        status
      } = filter;

      let whereConditions = [];
      let whereQuery = '';

      if (caseId) {
        let caseWhereCondition = `
        master_project_ai_summary.projectId
        IN(
          SELECT
                    projectid
              FROM
                    master_case_project
              WHERE
                    master_case_project.caseid = '${caseId}'
        )
          AND master_project_ai_summary.status = 'active'`;

        whereConditions.push(caseWhereCondition);

        if (caseProjectIds && caseProjectIds.length > 0) {
          const caseProjectIdCondition = `projects.projectId in ('${caseProjectIds.join("', '")}')`;
          whereConditions.push(caseProjectIdCondition);
        }

        if (caseProjectCodes && caseProjectCodes.length > 0) {
          const caseProjectCodeCondition = `projects.projectCode in ('${caseProjectCodes.join("', '")}')`;
          whereConditions.push(caseProjectCodeCondition);
        }

        if (caseProjectNames && caseProjectNames.length > 0) {
          const caseProjectNameCondition = `projects.projectName in ('${caseProjectNames.join("', '")}')`;
          whereConditions.push(caseProjectNameCondition);
        }

      }

      if (projectId) {
        let projectWhereCondition = `master_project_ai_summary.projectId = '${projectId}'`;
        whereConditions.push(projectWhereCondition);
      }

      if (createdOnStartDate || createdOnEndDate) {
        const startDate = `${createdOnStartDate} 00:00:00`;
        const endDate = `${createdOnEndDate} 23:59:59`;

        const earliestDate = "0000-01-01 00:00:00";
        const latestDate = "9999-12-31 23:59:59";

        const createdOnCondition = `master_project_ai_summary.createdtime BETWEEN "${createdOnStartDate ? startDate : earliestDate}" AND "${createdOnEndDate ? endDate : latestDate}"`;
        whereConditions.push(createdOnCondition);
      }

      if (status && status.length > 0) {
        const statusCondition = `master_project_ai_summary.status in ('${status.join("', '")}')`;
        whereConditions.push(statusCondition);
      }


      if (whereConditions.length > 0) {
        whereQuery = 'WHERE ' + whereConditions.join(" AND ");
      }


      //sort
      const { sortField, sortOrder } = sort;
      let orderQuery = 'ORDER BY master_project_ai_summary.createdtime DESC';

      if (sortField && sortOrder) {
        orderQuery = 'ORDER BY';

        switch (sortField) {
          case 'TechnicalSummaryId': orderQuery += ' master_project_ai_summary.summary_identifier ';
            break;
          case 'projectId': orderQuery += ' projects.projectId ';
            break;
          case 'ProjectName': orderQuery += ' projects.projectName ';
            break;
          case 'projectCode': orderQuery += ' projects.projectCode ';
            break;
          case 'Status': orderQuery += ' master_project_ai_summary.status ';
            break;
          case 'GeneratedOn': orderQuery += ' master_project_ai_summary.createdtime ';
            break;
          case 'GeneratedBy': orderQuery += ' master_project_ai_summary.createdby ';
            break;
        }

        orderQuery = sortOrder == 'dsc' ? orderQuery + 'DESC' : orderQuery;
      }

      const sqlQuery = `
        SELECT
        CONCAT('TS-', LPAD(master_project_ai_summary.summary_identifier, 5, '0')) AS TechnicalSummaryIdentifier,
          master_project_ai_summary.id as TechnicalSummaryId,
          projects.projectCode,
          projects.projectId,
          projects.projectIdentifier as ProjectIdentifier,
          projects.projectName AS ProjectName,
            master_project_ai_summary.status as Status,
            master_project_ai_summary.createdtime AS GeneratedOn,
              master_project_ai_summary.createdby AS GeneratedBy
        FROM
        master_project_ai_summary
        JOIN
          projects ON projects.projectId = master_project_ai_summary.projectId
        ${whereQuery}
        ${orderQuery};
        `;

      const summayList = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return summayList;
    }
    catch (error) {
      console.log("Error while fetching summary list : ", error);
      throw error;
    }
  },


  getTimesheetProjects: async function (timesheetId) {
    try {
      const query = `
        SELECT
        p.*,
          p.projectCode as sourceProjectId,
          port.PortfolioName AS PortfolioName,
            port.portfolioId AS portfolioId,
              MAX(co.companyName) AS companyName,
                MAX(ct.contactId) AS contactId,
                  MAX(ct.firstName) AS firstName,
                    MAX(ct.middleName) AS middleName,
                      MAX(ct.lastName) AS lastName,
                        CONCAT('PR-', LPAD(p.projectIdentifier, 7, '0')) AS projectIdentifier,
                          MAX(co.currencySymbol) AS symbol,
                            MAX(rnd.rd_score) AS rndPotential,
                              MAX(p.TotalExpense / 100 * rnd.rd_score) as rndExpense,
                              MAX(co.currency) AS currency,
                                MAX(co.currencySymbol) AS currencySymbol
        FROM 
              projects p
          LEFT JOIN 
              portfolio_projects_Rel pp ON p.projectId = pp.projectId
          LEFT JOIN 
              Portfolios port ON pp.portfolioId = port.portfolioId
          LEFT JOIN 
              company co ON p.companyId = co.companyId
          LEFT JOIN 
              TeamMembers tm ON tm.teamMemberId = p.projectManagerId
          LEFT JOIN 
              contacts ct ON ct.contactId = tm.contactId
		      LEFT JOIN
			        timesheettasks ON timesheettasks.projectId = p.projectIdentifier
          LEFT JOIN
          (
            SELECT 
                  master_project_ai_assessment.projectId,
            master_project_ai_assessment.rd_score
              FROM 
                  master_project_ai_assessment
              INNER JOIN(
              SELECT 
                      projectId,
              MAX(createdtime) AS latest_created
                  FROM 
                      master_project_ai_assessment
                  GROUP BY 
                      projectId
            ) AS latest_projects
              ON 
                  master_project_ai_assessment.projectId = latest_projects.projectId
                  AND master_project_ai_assessment.createdtime = latest_projects.latest_created
          ) AS rnd ON rnd.projectId = p.projectIdentifier
        WHERE
        timesheettasks.timesheetId = : timesheetId
          GROUP BY
        p.projectId, p.projectIdentifier, port.PortfolioName, port.portfolioId;
        `;

      const data = await sequelize.query(query, {
        replacements: { timesheetId: timesheetId },
        type: Sequelize.QueryTypes.SELECT
      });


      return data;
    } catch (error) {
      console.error("Error fetching projects", error);
      throw error;
    }
  },

  getProjectsListFromPortfolio: async function (portfolioId) {
    const data = await sequelize.query(
      `
        SELECT
        pr.projectId,
          pr.projectName,
          pr.projectCode,
          pr.projectManagerId,
          pr.projectType,
          pr.startDate,
          pr.endDate,
          pr.TotalBudget,
          pr.TotalExpense,
          pr.RnDExpenseCurrentYear,
          pr.RnDExpenseCumulative,
          pr.RnDHoursCumulative,
          pr.RnDHoursCurrentYear,
          pr.NonRnDHoursCumulative,
          pr.NonRnDHoursCurrentYear,
          pr.uncertainHoursCumulative,
          pr.uncertainHoursCurrentYear,
          pr.projectsIndustry,
          pr.natureofProject,
          pr.EmpBlendedRatePerHour,
          pr.successCriteria,
          pr.techStack,
          pr.createdBy AS projectCreatedBy,
            pr.createdTime AS projectCreatedTime,
              pr.modifiedBy AS projectModifiedBy,
                pr.modifiedTime AS projectModifiedTime
        FROM 
            portfolio_projects_Rel rel
        INNER JOIN 
            projects pr ON rel.projectId = pr.projectId
        WHERE
        rel.portfolioId = : portfolioId;
        `,
      {
        replacements: { portfolioId },
        type: Sequelize.QueryTypes.SELECT
      }
    )
    return data;
  },
  getKpi: async function (companyIds) {
    let whereClause = '';
    if (companyIds !== null) {
      whereClause = `WHERE companyId IN(${companyIds.map(id => `'${id}'`).join(', ')})`;
    }

    const [rndPercent] = await sequelize.query(
      `
        SELECT
        JSON_ARRAYAGG(projectId) AS projectId,
          JSON_ARRAYAGG(projectName) AS projectName,
            JSON_ARRAYAGG(rndPercentage) AS rndPercentage
        FROM(
          SELECT 
            projectId,
          projectName,
          COALESCE(ROUND(CAST(COALESCE(RnDExpenseCumulative, '0') AS DECIMAL) / 1000, 2), 0) AS rndPercentage
          FROM
            projects
          ${whereClause}
          ORDER BY
            rndPercentage DESC
          LIMIT 5
        ) AS subQuery;
        `,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const [ttc] = await sequelize.query(
      `
        SELECT
        JSON_ARRAYAGG(projectId) AS projectId,
          JSON_ARRAYAGG(projectName) AS projectName,
            JSON_ARRAYAGG(RnDExpenseCumulative) AS ttc
        FROM(
          SELECT 
            projectId,
          projectName,
          CAST(COALESCE(RnDExpenseCumulative, '0') AS DECIMAL(10, 2)) AS RnDExpenseCumulative
          FROM
            projects
            ${whereClause}
          ORDER BY
            CAST(COALESCE(RnDExpenseCumulative, '0') AS DECIMAL(10, 2)) DESC
          LIMIT 5
        ) as subQuery;
        `,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    )

    const [uncertainHours] = await sequelize.query(
      `
        SELECT
        JSON_ARRAYAGG(projectId) AS projectId,
          JSON_ARRAYAGG(projectName) AS projectName,
            JSON_ARRAYAGG(uncertainHoursCumulative) AS uncertainHours
        FROM(
          SELECT 
            projectId,
          projectName,
          CAST(COALESCE(uncertainHoursCumulative, '0') AS DECIMAL(10, 2)) AS uncertainHoursCumulative
          FROM
            projects
            ${whereClause}
          ORDER BY
            CAST(COALESCE(uncertainHoursCumulative, '0') AS DECIMAL(10, 2)) DESC
          LIMIT 5
        ) as subQuery;
        `,
      {
        type: Sequelize.QueryTypes.SELECT
      }
    )

    return { rndPercent, ttc, uncertainHours };
  },

  getTeam: async function (filter, sort) {
    try {

      //filter
      const {
        projectId,
        names,
        projectRoles,
        minHourlyRate,
        maxHourlyrate,
        minTotalHours,
        maxTotalHours,
        minTotalExpense,
        maxTotalExpense,
        minRnDExpense,
        maxRnDExpense
      } = filter;

      let whereConditions = [];
      let whereQuery = '';

      if (projectId) {
        let projectIdCondition = `teammembers.projectId = '${projectId}'`;
        whereConditions.push(projectIdCondition);
      }

      if (names && names.length > 0) {
        const nameCondition = `contacts.firstName in ('${names.join("','")}')`;
        whereConditions.push(nameCondition);
      }

      if (projectRoles && projectRoles.length > 0) {
        const projectRoleCondition = `teammembers.projectRole in ('${projectRoles.join("','")}')`;
        whereConditions.push(projectRoleCondition);
      }

      if (minHourlyRate || maxHourlyrate) {
        const hourlyRateCondition = `taskData.hourlyRate BETWEEN ${minHourlyRate ? minHourlyRate : 0} AND  ${maxHourlyrate ? maxHourlyrate : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(hourlyRateCondition);
      }

      if (minTotalHours || maxTotalHours) {
        const totalHoursCondition = `taskData.totalHours BETWEEN ${minTotalHours ? minTotalHours : 0} AND  ${maxTotalHours ? maxTotalHours : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(totalHoursCondition);
      }

      if (minTotalExpense || maxTotalExpense) {
        const totalExpenseCondition = `taskData.totalExpense BETWEEN ${minTotalExpense ? minTotalExpense : 0} AND  ${maxTotalExpense ? maxTotalExpense : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(totalExpenseCondition);
      }

      if (minRnDExpense || maxRnDExpense) {
        const hourlyRateCondition = `taskData.rndExpense BETWEEN ${minRnDExpense ? minRnDExpense : 0} AND  ${maxRnDExpense ? maxRnDExpense : Number.MAX_SAFE_INTEGER} `;
        whereConditions.push(hourlyRateCondition);
      }

      whereQuery = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      //sort
      const { sortField, sortOrder } = sort;
      let orderClause = '';

      if (sortField && sortOrder) {
        orderClause = 'ORDER BY';

        switch (sortField) {
          case 'name': orderClause += ' contacts.firstName ';
            break;
          case 'projectRole': orderClause += ' teammembers.projectRole ';
            break;
          case 'hourlyRate': orderClause += ' taskData.hourlyRate ';
            break;
          case 'totalHours': orderClause += ' taskData.totalHours ';
            break;
          case 'totalExpense': orderClause += ' taskData.totalExpense ';
            break;
          case 'rndCost': orderClause += ' taskData.rndExpense ';
            break;
        }

        orderClause = sortOrder == 'dsc' ? orderClause + 'DESC' : orderClause;
      }

      const sqlQuery = `
        SELECT
            contacts.firstName AS contactFirstName,
            contacts.lastName AS contactLastName,
            contacts.email AS contactEmail,
            contacts.employeeTitle as contactTitle,
            teammembers.projectRole,
            taskData.totalHours,
            taskData.totalExpense,
            taskData.rndExpense AS rndCost,
            taskData.hourlyRate
        FROM
            contacts
        JOIN
          teammembers ON teammembers.contactId = contacts.contactId
        JOIN
          (
            SELECT
                SUM(timesheettasks.taskEffort) AS totalHours,
                SUM(timesheettasks.taskTotalExpense) AS totalExpense,
                SUM(timesheettasks.RnDExpense) AS rndExpense,
                MAX(timesheettasks.taskHourlyRate) AS hourlyRate,
                timesheettasks.teamMemberId
            FROM
                timesheettasks
            GROUP BY teamMemberId
          ) AS taskData ON taskData.teamMemberId = teammembers.teamMemberId
        ${whereQuery}
        ${orderClause};
        `;

      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT
      });

      return data;

    } catch (error) {
      console.log("Erroe fetching project team members : ", error);
      throw error;
    }
  },


  getProjectDetails: async function (projectId) {
    try {
      const projectDetailsQuery = `
          SELECT
              projects.projectIdentifier,
              projects.projectId,
              projects.projectCode,
              projects.projectName,
              projects.description,
              projects.spocName,
              projects.spocEmail,
              projects.oldSpocName,
              projects.oldSpocEmail,
              projects.s_project_status,
              projects.s_fte_cost,
              projects.s_subcon_cost,
              COALESCE(projects.s_fte_cost, 0) + COALESCE(projects.s_subcon_cost, 0) AS s_total_project_cost,
              projects.s_fte_hours,
              projects.s_subcon_hours,
              projects.s_fte_hours + projects.s_subcon_hours AS s_total_hours,
              projects.s_rnd_adjustment,
              projects.s_fte_qre_cost,
              projects.s_subcon_qre_cost,
              projects.s_rd_credits,
              COALESCE(projects.s_fte_qre_cost, 0) + COALESCE(projects.s_subcon_qre_cost, 0) AS s_qre_cost,
              projects.s_data_gathering,
              projects.s_pending_data,
              projects.s_timesheet_status,
              projects.s_fte_cost_status,
              projects.s_subcon_cost_status,
              projects.s_technical_interview_status,
              projects.s_technical_summary_status,
              projects.s_financial_summary_status,
              projects.s_claims_form_status,
              projects.s_final_review_status,
              projects.s_interaction_status,
              projects.s_last_updated_by,
              projects.s_last_updated_timestamp,
              projects.s_notes,
              projects.projectType,
              projects.s_rnd_status,

              rnd.rd_score AS rndPotential,
              COALESCE(rnd.rd_score, 0) + COALESCE(projects.s_rnd_adjustment, 0) AS rndFinal,
              COALESCE(surveyDetails.surveyStatus, 'NOT SENT') AS surveyStatus,
              surveyDetails.surveySentDate,
              surveyDetails.reminderSentDate,
              surveyDetails.surveyResponseDate,

              company.companyId,
              company.companyName,
              company.fiscalYear,
              company.currency,
              company.currencySymbol,
              company.fteMultiplier,
              company.subconMultiplier
          FROM
              projects
          LEFT JOIN 
              company ON projects.companyId = company.companyId
          LEFT JOIN
              (
                SELECT 
                    master_project_ai_assessment.projectId,
                    master_project_ai_assessment.rd_score
                FROM 
                    master_project_ai_assessment
                INNER JOIN
                    (
                      SELECT 
                          projectId,
                          MAX(createdtime) AS latest_created
                      FROM 
                          master_project_ai_assessment
                      GROUP BY 
                          projectId
                    ) AS latest_projects ON master_project_ai_assessment.projectId = latest_projects.projectId AND master_project_ai_assessment.createdtime = latest_projects.latest_created
                ) AS rnd ON rnd.projectId = projects.projectIdentifier
          LEFT JOIN
              (
                  SELECT
                      master_case_project.projectid,
                      system_status.status AS surveyStatus,
                      master_survey.closeDate AS surveyResponseDate,
                      master_survey.modifiedtime AS reminderSentDate,
                      master_survey.createdtime AS surveySentDate
                  FROM
                      master_case_project
                  JOIN
                      master_survey_assignment ON master_survey_assignment.caseprojectid = master_case_project.id
                  JOIN
                      master_survey ON master_survey.id = master_survey_assignment.surveyid
                  JOIN
                      system_status ON system_status.id = master_survey.surveystatusid
              ) AS surveyDetails ON surveyDetails.projectid = projects.projectId
          WHERE projects.projectId = '${projectId}';
    `;
      const projectDetails = await sequelize.query(projectDetailsQuery, {
        type: Sequelize.QueryTypes.SELECT
      });


      //remove code from here
      const fteCost = projectDetails[0].s_fte_cost;
      const subconCost = projectDetails[0].s_subcon_cost;
      const qreFinal = projectDetails[0].rndFinal / 100;
      const fteMultiplier = projectDetails[0].fteMultiplier;
      const subconMultiplier = projectDetails[0].subconMultiplier;

      if (fteCost) projectDetails[0].s_fte_qre_cost = fteCost * qreFinal * fteMultiplier;
      if (subconCost) projectDetails[0].s_subcon_qre_cost = subconCost * qreFinal * subconMultiplier;

      projectDetails[0].s_qre_cost = parseFloat(projectDetails[0].s_fte_qre_cost + projectDetails[0].s_subcon_qre_cost);
      //interaction status
      const interactionquery = `
        SELECT
          system_status.status,
            master_interactions.createdtime,
            master_interactions.modifiedtime
        FROM
          system_status
        JOIN
          master_interactions ON master_interactions.statusid = system_status.id
        WHERE
          master_interactions.projectidentifier = '${projectId}'
        ORDER BY
          master_interactions.modifiedtime DESC, master_interactions.createdtime DESC;
      `;
      const interactionDetails = await sequelize.query(interactionquery, {
        type: Sequelize.QueryTypes.SELECT
      });

      if (interactionDetails && interactionDetails.length > 0) {
        if (interactionDetails[0].status === 'RESPONSE RECEIVED') {
          const modifiedTime = new Date(interactionDetails[0].modifiedtime);
          const dateTime = modifiedTime.toLocaleString("en-GB", {
            year: "numeric",
            month: "short",
            day: "2-digit"
          });

          projectDetails[0].s_interaction_status = `Response Received ${dateTime}`;
        } else {
          projectDetails[0].s_interaction_status = `Response Not Received`;
        }
      }
      //till here


      const survey = await MasterSurvey.findOne({ where: { projectid: projectId } });
      if (!survey) {
        return { overview: projectDetails, survey: "Survey Not Sent" };
      }

      const surveyId = survey.dataValues.id;
      const surveys = await caseQueries.getSurveyById(surveyId);
      const questionAnswer = await surveyQueries.getSurveyQuestionAndAnswers(surveyId);
      const toTitleCase = (str) => {
        return str.replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      };
      if (surveys && surveys.status) {
        surveys.status = toTitleCase(surveys.status);
      }
      const surveyData = {
        surveyDetails: surveys,
        questionAnswer: questionAnswer
      };


      return { overview: projectDetails, survey: surveyData };

    } catch (error) {
      console.log("Erroe fetching project details : ", error);
      throw error;
    }


  },
  getTimesheetByProject: async function (companyId, projectId) {
    // const data = await Timesheets.findAll({
    //   where: {
    //     projectId: projectId,
    //     companyId: companyId
    //   }
    // });

    const data1 = await sequelize.query(
      `
        SELECT
            timesheettasks.timesheetId,
            timesheetuploadlog.month AS timesheetMonth,
            timesheetuploadlog.year AS timesheetYear,
            timesheetuploadlog.uploadedOn,
            SUM(timesheettasks.taskEffort) as totalHours,
            SUBSTRING_INDEX(timesheetuploadlog.url, '-', -1) AS originalFileName,
            timesheetuploadlog.status as status
        FROM
            timesheettasks
        JOIN
            timesheetuploadlog ON timesheettasks.timesheetId = timesheetuploadlog.timesheetId
        WHERE
            timesheettasks.projectId = :projectId
        GROUP BY
            timesheettasks.timesheetId,
            timesheetuploadlog.month,
            timesheetuploadlog.year,
            timesheetuploadlog.uploadedOn,
            timesheetuploadlog.url,
            timesheetuploadlog.status;
`,
      {
        replacements: { projectId, companyId },
        type: Sequelize.QueryTypes.SELECT
      }
    )
    return data1;
  },
  getFinancialsByProject: async function (companyId, projectId) {
    const projectDetails = await Project.findOne({
      where: {
        projectId,
        companyId
      }
    });

    let [data] = await sequelize.query(`
      SELECT 
          JSON_ARRAYAGG(monthlyRnDExpense) as projectRnDExpense,
          JSON_ARRAYAGG(monthlyTotalExpense) as TotalExpense,
          JSON_ARRAYAGG(monthYear) as projectDate
      FROM (
          SELECT 
              SUM(projectRnDExpense) as monthlyRnDExpense,
              SUM(TotalExpense) as monthlyTotalExpense,
              DATE_FORMAT(projectDate, '%Y-%m') as monthYear
          FROM
              projectFinancialDaily
          WHERE 
              projectId = :projectId AND
              companyId = :companyId
          GROUP BY 
              DATE_FORMAT(projectDate, '%Y-%m')
      ) subQuery;
    `,
      {
        replacements: { projectId, companyId },
        type: Sequelize.QueryTypes.SELECT
      });
    const TotalBudget = createConstantValueArray(data?.projectDate?.length, projectDetails?.TotalBudget)
    data.TotalBudget = TotalBudget
    return data;
  },
  addNewMilestone: async function (projectId, companyId, body) {
    const data = await ProjectMilestones.create({
      projectId: projectId,
      companyId: companyId,
      milestoneName: body.milestoneName,
      startDate: body.startDate,
      endDate: body.endDate,
      milestoneStatus: "Achieved",
      createdBy: body.createdBy,
      modifiedBy: body.modifiedBy
    });
    return data;
  },


  editProjectDetails: async function (projectId, body) {
    const data = await Project.update(body, {
      where: {
        projectId: projectId
      }
    });
    return data;
  },


  addProjectDetails: async function (body) {
    const data = await Project.create({
      // Note
      // missing points status, projectManager, RnD expense, what to do with extra variable ?
      companyId: body.companyId,
      projectName: body.projectName ? body.projectName : null,
      projectCode: body.projectCode ? body.projectCode : null,
      projectType: body.projectType ? body.projectType : null,
      projectManagerId: body.projectManagerId ? body.projectManagerId : null,
      projectPortfolio: body.projectPortfolio ? body.projectPortfolio : null,
      description: body.description ? body.description : null,
      notes: body.notes ? body.notes : null,
      accountingYear: body.accountingYear ? body.accountingYear : null,
      startDate: body.startDate ? body.startDate : null,
      endDate: body.endDate ? body.endDate : null,
      plannedDuration: body.plannedDuration ? body.plannedDuration : null,
      actualStartDate: body.actualStartDate ? body.actualStartDate : null,
      actualEndDate: body.actualEndDate ? body.actualEndDate : null,
      actualDuration: body.actualDuration ? body.actualDuration : null,
      TotalBudget: body.TotalBudget ? body.TotalBudget : null,
      TotalExpense: body.TotalExpense ? body.TotalExpense : null,
      RnDExpenseCurrentYear: body.RnDExpenseCurrentYear ? body.RnDExpenseCurrentYear : null,
      RnDExpenseCumulative: body.RnDExpenseCumulative ? body.RnDExpenseCumulative : null,
      RnDHoursCumulative: body.RnDHoursCumulative ? body.RnDHoursCumulative : null,
      RnDHoursCurrentYear: body.RnDHoursCurrentYear ? body.RnDHoursCurrentYear : null,
      uncertainHoursCumulative: body.uncertainHoursCumulative ? body.uncertainHoursCumulative : null,
      uncertainHoursCurrentYear: body.uncertainHoursCurrentYear ? body.uncertainHoursCurrentYear : null,
      projectsIndustry: body.projectsIndustry ? body.projectsIndustry : null,
      natureofProject: body.natureofProject ? body.natureofProject : null,
      EmpBlendedRatePerHour: body.EmpBlendedRatePerHour ? body.EmpBlendedRatePerHour : null,
      successCriteria: body.successCriteria ? body.successCriteria : null,
      projectStatus: body.projectStatus || null,
      techStack: body.successCriteria,
      createdBy: body.createdBy ? body.createdBy : null,
      modifiedBy: body.modifiedBy ? body.modifiedBy : null
    });
    return data;
  },
  addTeamMember: async function (body) {
    const newMember = await TeamMember.create(body)
    return newMember
  },

  getSummary: async function (summaryId) {
    try {
      const sqlQuery = `
      SELECT
        CONCAT('TS-', LPAD(master_project_ai_summary.summary_identifier, 5, '0')) AS TechnicalSummaryId,
        master_project_ai_summary.createdby AS createdBy,
        master_project_ai_summary.createdtime AS createdTime,
        master_project_ai_summary.summary AS TechnicalSummary,
        projects.projectCode,
        projects.projectId,
        projects.projectName AS projectName
      FROM
        master_project_ai_summary
        LEFT JOIN projects ON master_project_ai_summary.projectid = projects.projectId
      WHERE
        master_project_ai_summary.id = :summaryId;
    `;

      const summary = await sequelize.query(sqlQuery, {
        replacements: { summaryId: summaryId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return summary;
    } catch (error) {
      console.log("Error while fetching summary: ", error);
      throw error;
    }
  },

  getInteractionsList: async function (filter, sort) {
    try {

      const {
        caseId,
        projectId,
        caseProjectIds,
        caseProjectCodes,
        caseProjectNames,
        sentToEmails,
        sentStartDate,
        sentEndDate,
        responseReceivedStartDate,
        responseReceivedEndDate,
        status
      } = filter;

      let whereConditions = [];
      let whereQuery = '';

      if (caseId) {
        let caseWhereCondition = `
                master_interactions.projectidentifier IN (
                    SELECT
                        master_case_project.projectId
                    FROM 
                        master_case_project
                    WHERE
                        master_case_project.caseid = '${caseId}'
                )`
          ;

        whereConditions.push(caseWhereCondition);

        if (caseProjectIds && caseProjectIds.length > 0) {
          const caseProjectIdCondition = `projects.projectId in ('${caseProjectIds.join("', '")}')`;
          whereConditions.push(caseProjectIdCondition);
        }

        if (caseProjectCodes && caseProjectCodes.length > 0) {
          const caseProjectCodeCondition = `projects.projectCode in ('${caseProjectCodes.join("', '")}')`;
          whereConditions.push(caseProjectCodeCondition);
        }

        if (caseProjectNames && caseProjectNames.length > 0) {
          const caseProjectNameCondition = `projects.projectName in ('${caseProjectNames.join("', '")}')`;
          whereConditions.push(caseProjectNameCondition);
        }

      }

      if (projectId) {
        let projectWhereCondition = `master_interactions.projectidentifier = '${projectId}'`;
        whereConditions.push(projectWhereCondition);
      }

      if (sentToEmails && sentToEmails.length > 0) {
        const sentToCondition = `master_interactions.spocemail in ('${sentToEmails.join("', '")}')`;
        whereConditions.push(sentToCondition);
      }

      if (status && status.length > 0) {
        const statusCondition = `system_status.status in ('${status.join("', '")}')`;
        whereConditions.push(statusCondition);
      }

      if (sentStartDate || sentEndDate) {
        const startDate = `${sentStartDate} 00:00:00`;
        const endDate = `${sentEndDate} 23:59:59`;

        const earliestDate = "0000-01-01 00:00:00";
        const latestDate = "9999-12-31 23:59:59";

        const createdOnCondition = `master_interactions.createdtime BETWEEN "${sentStartDate ? startDate : earliestDate}" AND "${sentEndDate ? endDate : latestDate}"`;
        whereConditions.push(createdOnCondition);
      }

      if (responseReceivedStartDate || responseReceivedEndDate) {
        const startDate = `${responseReceivedStartDate} 00:00:00`;
        const endDate = `${responseReceivedEndDate} 23:59:59`;

        const earliestDate = "0000-01-01 00:00:00";
        const latestDate = "9999-12-31 23:59:59";

        const createdOnCondition = `master_interactions.modifiedtime BETWEEN "${responseReceivedStartDate ? startDate : earliestDate}" AND "${responseReceivedEndDate ? endDate : latestDate}"`;
        whereConditions.push(createdOnCondition);
      }

      if (whereConditions.length > 0) {
        whereQuery = 'WHERE ' + whereConditions.join(" AND ");
      }


      //sort
      const { sortField, sortOrder } = sort;
      let orderQuery = 'ORDER BY master_interactions.createdtime DESC';

      if (sortField && sortOrder) {
        orderQuery = 'ORDER BY';

        switch (sortField) {
          case 'interactionsIdentifier': orderQuery += ' master_interactions.interactionsid ';
            break;
          case 'projectId': orderQuery += ' projects.projectId ';
            break;
          case 'projectName': orderQuery += ' projects.projectName ';
            break;
          case 'projectCode': orderQuery += ' projects.projectCode ';
            break;
          case 'status': orderQuery += ' system_status.status ';
            break;
          case 'sentDate': orderQuery += ' master_interactions.createdtime ';
            break;
          case 'responseDate': orderQuery += ' master_interactions.modifiedtime ';
            break;
          case 'sentTo': orderQuery += ' master_interactions.spocemail ';
            break;
        }

        if (sortOrder == 'dsc') {
          orderQuery += 'desc';
        }
      }

      const sqlQuery = `
      SELECT
          master_interactions.id AS interactionId,
          CONCAT('IN-', LPAD(master_interactions.interactionsid, 4, '0')) AS interactionsIdentifier,
          projects.projectCode,
          projects.projectId,
          projects.projectIdentifier AS projectIdentifier,
          projects.projectName AS projectName,
          system_status.status,
          CASE
              WHEN system_status.status = 'NOT SENT' THEN NULL
              ELSE master_interactions.createdtime
          END AS sentDate,
          CASE
              WHEN system_status.status = 'RESPONSE RECEIVED' THEN master_interactions.modifiedtime
              ELSE null
          END AS responseDate,
          master_interactions.spocemail AS sentTo,
          CASE
              WHEN system_status.status = 'NOT SENT' THEN NULL
              ELSE master_interactions.url
          END AS externalLink,
          master_interactions.spocname AS spocName,
          master_interactions.spocemail AS spocEmail,
          master_interactions.oldspocname AS oldSpocName,
          master_interactions.oldspocemail AS oldSpocEmail
      FROM
          master_interactions
      JOIN
          projects ON projects.projectId = master_interactions.projectidentifier
      JOIN
          system_status ON system_status.id = master_interactions.statusid
      ${whereQuery}
      ${orderQuery};
      `;

      const interactions = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return interactions;
    }
    catch (error) {
      console.log("Error while fetching summary list : ", error);
      throw error;
    }
  },

  getProjectTasks: async function (projectIdentifier, limit, page) {
    try {

      const offset = page * limit;

      const sqlQuery = `
      SELECT
          timesheettasks.taskId,
              timesheettasks.timesheetId,
              timesheettasks.teamMemberId,
              timesheettasks.teamMemberId,
              timesheettasks.taskDate,
              timesheettasks.taskDescription,
              timesheettasks.companyId,
              projects.projectCode,
              projects.projectId,
              timesheettasks.taskClassification,
              timesheettasks.taskHourlyRate,
              timesheettasks.taskEffort,
              timesheettasks.taskTotalExpense,
              timesheettasks.RnDExpense,
              timesheettasks.createdBy,
              timesheettasks.createdTime,
              timesheettasks.modifiedBy,
              timesheettasks.modifiedTime,
              timesheettasks.sysModTime,
              timesheettasks.aistatus
      FROM
          timesheettasks
      JOIN
          projects ON projects.projectId = timesheettasks.projectId
      WHERE
          timesheettasks.projectId = :projectIdentifier
      LIMIT :limit 
      OFFSET :offset
      `;

      const sqlQuery1 = `select count(*) as count from timesheettasks where projectId =:projectIdentifier`;

      const taskCount = await sequelize.query(sqlQuery1, {
        replacements: { projectIdentifier: projectIdentifier },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      const tasks = await sequelize.query(sqlQuery, {
        replacements: { projectIdentifier: projectIdentifier, limit: parseInt(limit), offset: parseInt(offset) },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return { tasks: tasks, taskCount: taskCount[0].count };
    }
    catch (error) {
      console.log("Error while fetching summary list : ", error);
      throw error;
    }
  },

  getProjectsSheets: async function (companyId) {
    try {

      let whereClause = ` WHERE master_sheets.sheettype in ('projects' , 'surveys')`;

      if (companyId) {
        whereClause += ` AND master_sheets.companyid = ${companyId}`;
      }

      const sqlQuery = `
        SELECT
              master_sheets.id,
              master_sheets.sheetid AS sheetId,
              master_sheets.sheetname AS sheetName,
              master_sheets.sheettype AS sheetType,
              master_sheets.url,
              master_sheets.message AS note,
              master_sheets.status,
              master_sheets.totalrecords,
              master_sheets.acceptedrecords,
              master_sheets.rejectedrecords,
              company.companyName,
              company.companyId,
              CONCAT(platformusers.firstName, ' ', COALESCE(platformusers.middleName, ''), ' ', platformusers.lastName) AS uploadedBy,
              master_sheets.createdtime AS uploadedOn
        FROM
              master_sheets
        JOIN
              company ON company.companyId = master_sheets.companyid
        JOIN
              platformusers ON platformusers.userId = master_sheets.createdby
        ${whereClause}
        ORDER BY master_sheets.createdtime DESC;
      `;


      const projectsSheets = await sequelize.query(sqlQuery, {
        // replacements: { projectIdentifier: projectIdentifier, limit: parseInt(limit), offset: parseInt(offset) },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return projectsSheets;
    }
    catch (error) {
      console.log("Error while fetching summary list : ", error);
      throw error;
    }
  },

  getProjectsReport: async function (companyIds) {
    try {

      let whereQuery = ``;
      if (companyIds && companyIds.length > 0) {
        whereQuery = `WHERE projects.companyId in ('${companyIds.join("', '")}')`;
      }

      const sqlQuery = `
          SELECT
              projects.projectCode AS "Project ID",
              projects.projectName AS "Project Name",
              company.companyName AS "Account",
              company.fiscalYear AS "Fiscal Year",
              projects.spocName AS "SPOC Name",
              projects.spocEmail AS "SPOC Email",
              projects.s_project_status AS "Project Status",
              projects.s_fte_cost AS "Project Cost - FTE",
              projects.s_subcon_cost AS "Project Cost - Subcon",
              COALESCE(projects.s_fte_cost, 0) + COALESCE(projects.s_subcon_cost, 0) AS "Project Cost - Total",
              projects.s_fte_hours AS "Project Hours - FTE",
              projects.s_subcon_hours AS "Project Hours - Subcon",
              COALESCE(projects.s_fte_hours, 0) + COALESCE(projects.s_subcon_hours, 0) AS "Project Hours - Total",
              projects.s_rd_potential AS "QRE(%) - Potential",
              projects.s_rnd_adjustment AS "QRE(%) - Adjustment",
              COALESCE(rnd.rd_score, 0) + COALESCE(projects.s_rnd_adjustment, 0) AS "QRE(%) - Fianl",
              projects.s_fte_qre_cost AS "QRE - FTE",
              projects.s_subcon_qre_cost AS "QRE - Subcon",
              COALESCE(projects.s_fte_qre_cost, 0) + COALESCE(projects.s_subcon_qre_cost, 0) AS "QRE - Total",
              projects.s_rd_credits AS "R&D Credits",
              projects.s_data_gathering AS "Data Gathering",
              projects.s_pending_data AS "Pending Data",
              projects.s_timesheet_status AS "Timesheet Status",
              projects.s_fte_cost_status AS "Cost Status - Employee",
              projects.s_subcon_cost_status AS "Cost Status - Subcon",
              COALESCE(surveyDetails.surveyStatus, 'NOT SENT') AS "Survey Status",
              surveyDetails.surveySentDate AS "Survey - Sent Date",
              surveyDetails.reminderSendDate AS "Survey - Reminder Sent Date",
              surveyDetails.surveyResponseDate AS "Survey - Response Date",
              projects.s_interaction_status AS "Interaction - Status",
              projects.s_technical_interview_status AS "Technical Interview Status",
              projects.s_technical_summary_status AS "Technical Summary Status",
              projects.s_financial_summary_status AS "Financial Summary Status",
              projects.s_claims_form_status AS "Claims Form Status",
              projects.s_final_review_status AS "Final Review Status",
              projects.s_notes AS "Notes",
              projects.s_last_updated_timestamp AS "Last Updated Date",
              projects.s_last_updated_by AS "Last Updated By",
              projects.projectIdentifier AS "Project Identifier"
          FROM
              projects
          JOIN
              company ON company.companyId = projects.companyId
		      LEFT JOIN
              (
                SELECT 
                    master_project_ai_assessment.projectId,
                    master_project_ai_assessment.rd_score
                FROM 
                    master_project_ai_assessment
                INNER JOIN
                    (
                      SELECT 
                          projectId,
                          MAX(createdtime) AS latest_created
                      FROM 
                          master_project_ai_assessment
                      GROUP BY 
                          projectId
                    ) AS latest_projects ON master_project_ai_assessment.projectId = latest_projects.projectId AND master_project_ai_assessment.createdtime = latest_projects.latest_created
                ) AS rnd ON rnd.projectId = projects.projectIdentifier
          LEFT JOIN
              (
                  SELECT
                      master_case_project.projectid,
                      system_status.status AS surveyStatus,
                      master_survey.closeDate AS surveyResponseDate,
                      master_survey.modifiedtime AS reminderSendDate,
					            master_survey.createdtime AS surveySentDate
                  FROM
                      master_case_project
                  JOIN
                      master_survey_assignment ON master_survey_assignment.caseprojectid = master_case_project.id
                  JOIN
                      master_survey ON master_survey.id = master_survey_assignment.surveyid
                  JOIN
                      system_status ON system_status.id = master_survey.surveystatusid
              ) AS surveyDetails ON surveyDetails.projectid = projects.projectId
          ${whereQuery}
          ORDER BY
              projects.companyId,
              projects.projectId;

      `;

      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;

    } catch (error) {
      console.log("Error while fetching project report list : ", error);
      throw error;
    }
  },

  getTechnicalSummaryIds: async function (projectId, caseId) {
    try {

      let where = ``;
      if (projectId) {
        where = `where master_project_ai_summary.projectId='${projectId}'`
      } else if (caseId) {
        where = `join projects on projects.projectId = master_project_ai_summary.projectId
                join master_case_project on master_case_project.projectid = projects.projectId
                where master_case_project.caseid='${caseId}' and master_project_ai_summary.status='active'
        `
      }
      const sqlQuery = `
        select master_project_ai_summary.id 
        from master_project_ai_summary
        ${where}
        `;
      let data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      for (let i = 0; i < data.length; i++) {
        data[i] = data[i].id;
      }

      return data;
    }
    catch (error) {
      console.log("Error while fetching technicalSummaryids : ", error);
      throw error;
    }
  },
  getInteractions: async function (interactionsId) {
    try {

      let whereQuery = ``;
      if (interactionsId && interactionsId.length > 0) {
        whereQuery = ` where master_interactions.id in ('${interactionsId}')`;
      }

      const sqlQuery = `
          SELECT
              master_interactions.id,
              master_interactions_qa.question,
              master_interactions_qa.answer,
              company.companyName,
              projects.projectCode
          FROM
              master_interactions_qa
          JOIN 
              master_interactions ON master_interactions.id = master_interactions_qa.interactionsid
          JOIN
              company ON company.companyId = master_interactions_qa.companyid
          JOIN
              projects ON projects.projectidentifier = master_interactions_qa.projectidentifier
          ${whereQuery}
          ORDER BY 
              master_interactions_qa.createdtime
          `

      let data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;

    } catch (error) {
      console.log("Error while fetching interactions report list : ", error);
      throw error;
    }
  },
  getInteractionsIds: async function (projectId, caseId) {
    try {

      let where = ``;
      if (projectId) {
        where = `JOIN projects ON projects.projectidentifier = master_interactions.projectidentifier
                 where projects.projectId='${projectId}'`
      } else if (caseId) {
        where = `join projects on projects.projectId = master_project_ai_summary.projectId
                join master_case_project on master_case_project.projectid = projects.projectId
                where master_case_project.caseid='${caseId}' and master_project_ai_summary.status='active'
        `
      }
      const sqlQuery = `
        select master_interactions.id
        from master_interactions
        ${where}
        `;
      let data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      for (let i = 0; i < data.length; i++) {
        data[i] = data[i].id;
      }

      return data;
    }
    catch (error) {
      console.log("Error while fetching interactionsIds : ", error);
      throw error;
    }
  },
  getTechnicalSummaries: async function (technicalSummaryIds) {
    try {

      let whereQuery = ``;
      if (technicalSummaryIds && technicalSummaryIds.length > 0) {
        whereQuery = ` where master_project_ai_summary.id in ('${technicalSummaryIds.join("', '")}')`;
      }

      const sqlQuery = `
          SELECT
              master_project_ai_summary.id,
              master_project_ai_summary.summary,
              company.companyName,
              master_project_ai_summary.projectCode
          FROM
              master_project_ai_summary
          JOIN
              company ON company.companyId = master_project_ai_summary.companyId
          ${whereQuery}
          `

      let data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;

    } catch (error) {
      console.log("Error while fetching project report list : ", error);
      throw error;
    }
  },

  getRnDHistoryData: async function (projectId) {
    try {
      let whereQuery = '';
      if (projectId) {
        whereQuery = `WHERE projectId = '${projectId}'`;
      }

      const sqlQuery = `
        SELECT
          rd_score,
          createdtime,
          id
        FROM
          master_project_ai_assessment
        ${whereQuery}
        ORDER BY createdtime DESC
      `;

      // Execute the query using sequelize.query
      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;
    } catch (error) {
      console.error('Error fetching R&D history data:', error);
      throw error;
    }
  },
  getAssessmentDetails: async function (assessmentId) {
    try {
      let whereQuery = '';
      if (assessmentId) {
        whereQuery = `WHERE project_ai_assessment_id = '${assessmentId}'`;
      }

      const sqlQuery = `
        SELECT
          id,
          reference,
          createdtime
        FROM
          master_project_assessment_details
        ${whereQuery}
        ORDER BY createdtime DESC
        LIMIT 1
      `;

      // Execute the query using sequelize.query
      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;
    } catch (error) {
      console.error('Error fetching assessment details:', error);
      throw error;
    }
  },
  getAssessmentDetailsById: async function (id) {
    try {
      let whereQuery = '';
      if (id) {
        whereQuery = `WHERE id = '${id}'`;
      }

      const sqlQuery = `
        SELECT
          id,
          reference,
          createdtime
        FROM
          master_project_assessment_details
        ${whereQuery}
        ORDER BY createdtime DESC
        LIMIT 1
      `;

      // Execute the query using sequelize.query
      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;
    } catch (error) {
      console.error('Error fetching assessment details:', error);
      throw error;
    }
  },


  getCCEmailsByProjectId: async (projectId, purpose) => {
    try {

      const column = purpose == 'SURVEY' ? 'surveyCCMails' : purpose == 'INTERACTION' ? 'interactionCCMails' : '';
      if (column == '') return [];

      const project = await Project.findOne({
        attributes: [column],
        where: { projectId },
      });

      if (project && project[column]) { // Dynamically access the selected column
        return project[column]
          .split(',')
          .map(email => email.trim()) // Remove unnecessary spaces
          .filter(Boolean); // Filter out empty values
      }
      return [];
    } catch (error) {
      console.error(`Error fetching cc mails for projectId ${projectId}:`, error.message);
      throw new Error("Database error occurred while fetching ccEmails.");
    }
  },

  updateCCEmailsByProjectId: async (projectId, purpose, emails) => {
    try {

      const column = purpose == 'SURVEY' ? 'surveyCCMails' : purpose == 'INTERACTION' ? 'interactionCCMails' : '';
      if (column == '') throw new Error("Invalid purpose. Must be 'SURVEY' or 'INTERACTION'");

      const updatedRows = await Project.update(
        { [column]: emails.join(',') }, // Convert array to comma-separated string
        { where: { projectId } }
      );

      return updatedRows[0] > 0; // Returns true if rows were updated, false otherwise
    } catch (error) {
      console.error(`Error updating ccEmails for projectId ${projectId}:`, error.message);
      throw new Error("Database error occurred while updating ccEmails.");
    }
  },

};



module.exports = projectQueries