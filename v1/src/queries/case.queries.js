const { Sequelize, Op } = require("sequelize");
const sequelize = require("../setups/db");
const MasterCase = require("../models/master-case.model");
const { v4: uuidv4 } = require("uuid");
const SystemStatus = require("../models/system-status.model");
const MasterSurveyControl = require("../models/master-survey-control.model");
const MasterSurvey = require("../models/master-survey.model");
const MasterSurveyAnswer = require("../models/master-survey-answer.model");
const Project = require("../models/project.model");

const caseQueries = {

  getCaseProjects: async function (caseId) {
    try {
      const query = `
                      SELECT
                      master_case_project.projectname as projectName,
                      master_case_project.id as caseProjectId,
                      master_case_project.caseid as caseId,
                      master_case_project.projectmanager as projectManager,
                      master_case_project.spocname as spocName,
                      master_case_project.spocemail as spocEmail,
                      projects.totalEfforts as totalefforts,
                      projects.totalCosts as totalCosts,
                      projects.totalRnDEfforts as totalRnDEfforts,
                      projects.totalRnDCosts as totalRnDcosts,
                      master_case_project.flag,
                      master_case_project.flagmessage,
                      projects.projectCode,
                      projects.projectId,
                      projects.projectIdentifier,
                      company.currencySymbol,
                      company.currency,
                  CASE 
                      WHEN master_survey.projectid = master_case_project.projectid THEN TRUE
                      ELSE FALSE
                  END AS already_added
                  FROM
                      master_case_project
                  LEFT JOIN
                      master_survey ON master_case_project.projectid = master_survey.projectid
                  JOIN
                      projects on projects.projectId = master_case_project.projectid
                  LEFT JOIN
                      company on company.companyId = projects.companyId
                  WHERE
                  master_case_project.caseid = '${caseId}'
                  order by master_case_project.projectid;
            `;
      const caseProjects = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });
      return caseProjects;
    } catch (error) {
      console.error("Error fetching projects details by case ID:", error);
      throw error;
    }
  },

  getCaseFilterValues: async function () {
    try {

      const locationQuery = `SELECT DISTINCT billingCountry from company ORDER BY billingCountry ASC;`;
      const caseOwnerQuery = `
        SELECT
              DISTINCT CONCAT(COALESCE(platformusers.firstName, ''), ' ', COALESCE(platformusers.middleName, ''), ' ', COALESCE(platformusers.lastName, '')) AS caseOwnerName
        FROM
              master_case
        JOIN
          platformusers ON master_case.platformuserid = platformusers.userId;`;

      let countryName = await sequelize.query(locationQuery, { type: Sequelize.QueryTypes.SELECT });
      let caseOwners = await sequelize.query(caseOwnerQuery, { type: Sequelize.QueryTypes.SELECT });

      countryName = countryName.filter(item => item && item.billingCountry).map(item => item.billingCountry);
      caseOwners = caseOwners.filter(item => item && item.caseOwnerName).map(item => item.caseOwnerName);

      return { countryName, caseOwners };

    } catch (error) {
      console.log("Error fetching company filter values : ", error);
      throw error;
    }
  },

  getSurveysFilterValues: async function (caseId) {
    try {

      const sentbyemails = `
        SELECT
              DISTINCT email
        FROM
              platformusers
        JOIN
              master_case on master_case.platformuserid = platformusers.userId;
        `;

      const senttoemails = `
        SELECT
              DISTINCT spocemail
        FROM
              master_case_project
        WHERE master_case_project.caseid = '${caseId}';
      `;

      const caseprojects = `
        SELECT
              projects.projectId,
              projects.projectCode,
              projects.projectName
        FROM
              projects
        JOIN
              master_case_project ON master_case_project.projectid = projects.projectId
        JOIN
              master_survey_assignment ON master_survey_assignment.caseprojectid = master_case_project.id
        JOIN
              master_survey ON master_survey.id = master_survey_assignment.surveyid
        WHERE
              master_case_project.caseid = '${caseId}';
      `;

      let sentByEmails = await sequelize.query(sentbyemails, { type: Sequelize.QueryTypes.SELECT });
      let sentToEmails = await sequelize.query(senttoemails, { type: Sequelize.QueryTypes.SELECT });
      let caseProjects = await sequelize.query(caseprojects, { type: Sequelize.QueryTypes.SELECT });

      sentByEmails = sentByEmails.filter(item => item && item.email).map(item => item.email);
      sentToEmails = sentToEmails.filter(item => item && item.spocemail).map(item => item.spocemail);
      let status = ['SENT', 'REMINDER SENT', 'RESPONSE RECEIVED'];

      let caseProjectIds = [];
      let caseProjectNames = [];
      let caseProjectCodes = [];
      for (const obj of caseProjects) {
        caseProjectIds.push(obj.projectId);
        caseProjectNames.push(obj.projectName);
        caseProjectCodes.push(obj.projectCode);
      }


      return { sentByEmails, sentToEmails, status, caseProjectIds, caseProjectCodes, caseProjectNames };

    } catch (error) {
      console.log("Error fetching company filter values : ", error);
      throw error;
    }
  },

  getCasesWithSameComposition: async function (
    requiredFields,
    compositionFields
  ) {
    try {
      const whereClause = {}; // Initialize the where clause object

      // Construct the where clause dynamically based on requiredFields and compositionFields
      for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        const value = compositionFields[i];

        whereClause[field] = value ? { [Op.eq]: value } : { [Op.is]: null };
      }

      const casesWithSameComposition = await MasterCase.findAll({
        attributes: [["caseid", "caseCode"]],
        where: whereClause,
      });

      const caseCodes = casesWithSameComposition.map((caseInstance) => {
        const caseCode = caseInstance.dataValues.caseCode; // Access caseCode from dataValues
        if (caseCode !== undefined && caseCode !== null) {
          const paddedCode = caseCode.toString().padStart(4, "0"); // Pad the caseCode to 4 digits
          return `CS${paddedCode}`; // Format the caseCode as "CSXXXX" and return
        } else {
          return null; // Or handle the case where caseCode is undefined or null
        }
      });

      return caseCodes;
    } catch (error) {
      console.error("Error fetching cases with same composition:", error);
      throw error;
    }
  },

  getAllCasesWithDetails: async function (sortField, sortOrder, filter) {
    try {

      let appliedSort = 'Case Code ascending';
      let appliedFilterList = [];

      //filter
      let flterQuery = `WHERE `;
      let filtersArray = [];

      const { companyIds, locations, caseOwners } = filter;

      if (companyIds && companyIds.length > 0) {
        const companyIdQuery = `master_case.companyid in ('${companyIds.join("','")}')`;
        filtersArray.push(companyIdQuery);
        appliedFilterList.push('Account');
      }

      if (locations && locations.length > 0) {
        const LocationQuery = `company.billingCountry in ('${locations.join("','")}')`;
        filtersArray.push(LocationQuery);
        appliedFilterList.push('Location');
      }

      if (caseOwners && caseOwners.length > 0) {
        const caseOwnerQuery = `CONCAT(COALESCE(platformusers.firstName, ''), ' ', COALESCE(platformusers.middleName, ''), ' ', COALESCE(platformusers.lastName, '')) in ('${caseOwners.join("','")}')`;
        filtersArray.push(caseOwnerQuery);
        appliedFilterList.push('Case Owner');
      }

      flterQuery = flterQuery + filtersArray.join(" AND ");
      if (flterQuery == "WHERE ") {
        flterQuery = "";
      }

      //sort
      let orderQuery = `ORDER BY master_case.createdtime DESC `;
      if (sortField && sortOrder) {
        switch (sortField) {
          case "Case Code":
            orderQuery = `ORDER BY master_case.caseid `;
            appliedSort = 'Case Code';
            break;
          case "Case type":
            orderQuery = `ORDER BY system_type.type `;
            appliedSort = 'Case Type';
            break;
          case "Account":
            orderQuery = `ORDER BY company.companyName `;
            appliedSort = 'Account';
            break;
          case "Location":
            orderQuery = `ORDER BY company.billingCountry `;
            appliedSort = 'Location';
            break;
          case "Case Owner":
            orderQuery = `ORDER BY caseOwnerName `;
            appliedSort = 'Case Owner';
            break;
          case "Created On":
            orderQuery = `ORDER BY master_case.createdtime `;
            appliedSort = 'Created On';
            break;
        }

        if (sortOrder == 'dsc') {
          orderQuery += 'DESC';
          appliedSort += ' descending';
        } else {
          orderQuery += 'ASC';
          appliedSort += ' ascending';
        }
      }


      const sqlQuery = `
      SELECT
          master_case.id AS caseId,
          CONCAT('CS-', LPAD(master_case.caseid, 5, '0')) AS caseCode,
          master_case.createdtime AS createdOn,
          master_case.platformuserid  AS caseOwnerId,
          master_case.companyid AS companyId,
          system_type.id AS caseTypeId,
          system_type.type AS caseType,
          system_type.description AS caseTypeDescription,
          company.companyName AS companyName,
          company.billingCountry AS countryName,
          platformusers.email AS caseOwnerEmail,
          CONCAT(COALESCE(platformusers.firstName, ''), ' ', COALESCE(platformusers.middleName, ''), ' ', COALESCE(platformusers.lastName, '')) AS caseOwnerName
      FROM
          master_case
      LEFT JOIN
          system_type ON master_case.casetypeid = system_type.id
      LEFT JOIN
          company ON master_case.companyid = company.companyId
      LEFT JOIN
          platformusers ON master_case.platformuserid  = platformusers.userId
      ${flterQuery}
      ${orderQuery}
            `;

      const list = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true,
      });

      let appliedFilter = appliedFilterList.length > 0 ? appliedFilterList.join(',') : 'None';

      return { list, appliedSort, appliedFilter };
    } catch (error) {
      console.error("Error fetching all case records:", error);
      throw error;
    }
  },

  findCaseById: async function (caseId) {
    try {
      const sqlQuery = `
                  SELECT
                        master_case.id AS caseId,
                        CONCAT('CS-', LPAD(master_case.caseid, 7, '0')) AS caseCode,
                        master_case.createdtime AS createdOn,
                        company.fiscalYear AS accountingYear,
                        master_case.platformuserid  AS caseOwnerId,
                        system_type.id AS caseTypeId,
                        system_type.type AS caseType,
                        system_type.description AS caseTypeDescription,
                        company.companyid AS companyId,
                        company.companyName AS companyName,
                        company.billingCountry AS countryName,
                        platformusers.email AS caseOwnerEmail,
                        CONCAT(platformusers.firstName, ' ', COALESCE(platformusers.middleName, ''), ' ', platformusers.lastName) AS caseOwnerName,
                        projectsData.totalEfforts AS totalEfforts,
                        -- projectsData.totalCosts AS totalCosts,
                        projectsData.totalRnDEfforts AS totalRnDEfforts,
                        -- projectsData.totalrndcosts AS totalRnDCosts,
                        projectsData.totalProjects AS totalProjects,
                        company.currency,
                        company.currencySymbol
                  FROM
                      master_case
                  LEFT JOIN
                      system_type ON master_case.casetypeid = system_type.id
                  LEFT JOIN
                      company ON master_case.companyid = company.companyId
                  LEFT JOIN
                      platformusers ON master_case.platformuserid  = platformusers.userId
                  LEFT JOIN 
                    (
                      SELECT
                        master_case_project.caseid,
                        SUM(projects.totalEfforts) AS totalEfforts,
                        SUM(projects.s_fte_cost + projects.s_subcon_cost) AS totalCosts,
                        SUM(projects.totalRnDEfforts) AS totalRnDEfforts,
                        SUM(projects.s_fte_qre_cost + projects.s_subcon_qre_cost) AS totalRnDCosts,
                        COUNT(projects.projectId) AS totalProjects
                      FROM
                        projects
                      JOIN
                        master_case_project ON master_case_project.projectid = projects.projectId
                      GROUP BY master_case_project.caseid
                    ) AS projectsData ON projectsData.caseid = master_case.id
                  WHERE
                      master_case.id='${caseId}';
            `;

      const [caseRecord] = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true,
      });

      const averageRandDPotentialQuery = `
        SELECT
          SUM(COALESCE(master_project_ai_assessment.rd_score, 0)) / COUNT(master_case_project.projectid) AS averageRandDPotential,
          SUM(COALESCE(projects.s_fte_cost, 0) + COALESCE(projects.s_subcon_cost, 0)) AS totalCosts,
          SUM(
            COALESCE(projects.s_fte_cost, 0) * COALESCE(master_project_ai_assessment.rd_score, 0) / 100 * company.fteMultiplier + 
            COALESCE(projects.s_subcon_cost, 0) * COALESCE(master_project_ai_assessment.rd_score, 0) / 100 * company.subconMultiplier
          ) AS totalRnDCosts
        FROM
          master_case_project
        JOIN
          company ON company.companyId = master_case_project.companyid
        LEFT JOIN
          projects ON projects.projectId = master_case_project.projectid
        LEFT JOIN
          master_project_ai_assessment ON master_project_ai_assessment.projectId = master_case_project.projectid 
          AND master_project_ai_assessment.status = 'active'
        WHERE
          master_case_project.caseid = '${caseId}';
      `;
      const [rnd] = await sequelize.query(averageRandDPotentialQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true,
      });

      caseRecord.averageRandDPotential = rnd.averageRandDPotential;
      caseRecord.totalCosts = rnd.totalCosts;
      caseRecord.totalRnDCosts = rnd.totalRnDCosts;

      return caseRecord;
    } catch (error) {
      console.error("Error fetching case record:", error);
      throw error;
    }
  },

  getSurveyList: async function (caseId, filter, sort) {
    try {

      //filter
      const {
        projectIds,
        status,
        sentStartDate,
        sentEndDate,
        responseReceivedStartDate,
        responseReceivedEndDate,
        sentBy,
        sentTo,
        caseProjectIds,
        caseProjectCodes,
        caseProjectNames,
        caseId
      } = filter;

      let whereConditions = [];
      whereConditions.push(`master_case.id='${caseId}'`);
      let whereQuery = '';

      if (projectIds && projectIds.length > 0) {
        const projectIdsCondition = `projects.projectId in ('${projectIds.join("','")}')`;
        whereConditions.push(projectIdsCondition);
      }

      if (status && status.length > 0) {
        const statusCondition = `ss.status in ('${status.join("','")}')`;
        whereConditions.push(statusCondition);
      }

      if (sentStartDate || sentEndDate) {
        const startDate = `${sentStartDate} 00:00:00`;
        const endDate = `${sentStartDate} 23:59:59`;

        const earliestDate = "0000-01-01 00:00:00";
        const latestDate = "9999-12-31 23:59:59";

        const sentCondition = `ms.sentdate BETWEEN "${sentStartDate ? startDate : earliestDate}" AND "${sentEndDate ? endDate : latestDate}"`;
        whereConditions.push(sentCondition);
      }

      if (responseReceivedStartDate || responseReceivedEndDate) {
        const startDate = `${responseReceivedStartDate} 00:00:00`;
        const endDate = `${responseReceivedEndDate} 23:59:59`;

        const earliestDate = "0000-01-01 00:00:00";
        const latestDate = "9999-12-31 23:59:59";

        const sentCondition = `ms.closedate BETWEEN "${responseReceivedStartDate ? startDate : earliestDate}" AND "${responseReceivedEndDate ? endDate : latestDate}"`;
        whereConditions.push(sentCondition);
      }

      if (sentBy && sentBy.length > 0) {
        const sentByCondition = `pt.email in ('${sentBy.join("','")}')`;
        whereConditions.push(sentByCondition);
      }

      if (sentTo && sentTo.length > 0) {
        const sendToCondition = `master_case_project.spocemail in ('${sentTo.join("','")}')`;
        whereConditions.push(sendToCondition);
      }

      if (caseProjectIds && caseProjectIds.length > 0) {
        const caseProjectIdsCondition = `projects.projectId in ('${caseProjectIds.join("','")}')`;
        whereConditions.push(caseProjectIdsCondition);
      }

      if (caseProjectCodes && caseProjectCodes.length > 0) {
        const caseProjectCodeCondition = `projects.projectCode in ('${caseProjectCodes.join("','")}')`;
        whereConditions.push(caseProjectCodeCondition);
      }

      if (caseProjectNames && caseProjectNames.length > 0) {
        const projectNameCondition = `projects.projectName in ('${caseProjectNames.join("','")}')`;
        whereConditions.push(projectNameCondition);
      }

      if (whereConditions.length > 0) {
        whereQuery = 'where ' + whereConditions.join(" AND ");
      }


      //sort
      let orderQuery = '';
      const { sortField, sortOrder } = sort;

      if (sortField && sortOrder) {
        orderQuery = 'ORDER BY';

        switch (sortField) {
          case 'surveyCode': orderQuery += ' ms.surveyid ';
            break;
          case 'projectId': orderQuery += ' projects.projectId ';
            break;
          case 'projectName': orderQuery += ' projects.projectName ';
            break;
          case 'projectCode': orderQuery += ' projects.projectCode ';
            break;
          case 'status': orderQuery += ' ss.status ';
            break;
          case 'sentDate': orderQuery += ' ms.sentdate ';
            break;
          case 'responseDate': orderQuery += ' ms.closedate ';
            break;
          case 'sentBy': orderQuery += ' pt.email ';
            break;
          case 'sentTo': orderQuery += ' master_case_project.spocemail ';
            break;
          case 'lastUpdated': orderQuery += ' ms.modifiedtime ';
            break;
        }

        orderQuery = orderQuery == 'orderQuery' ? '' : sortOrder == 'dsc' ? orderQuery + 'desc' : orderQuery;
      }

      const sqlQuery = `
      SELECT
          ms.id as surveyId,
          ms.projectid as projectIdentifier,
          CONCAT('SV-', LPAD(ms.surveyid, 4, '0')) AS surveyCode,
          projects.projectCode,
          projects.projectId,
          projects.projectName,
          ms.sentdate AS sendDate,
          ms.closedate AS responseDate,
          DATEDIFF(CURDATE(), ms.sentdate) AS age,
          pt.email AS sentBy,
          master_case_project.spocemail AS sendTo,
          msa.url AS privateUrl,
          ss.status AS status,
          master_case_project.spocname AS spocName,
          master_case_project.spocemail AS spocEmail,
          master_case_project.oldspocname AS oldSpocName,
          master_case_project.oldspocemail AS oldSpocEmail,
          master_case_project.id AS caseProjectId,
          ms.modifiedtime AS lastUpdated,
          CASE 
              WHEN ss.status = 'RESPONSE RECEIVED' THEN 
                  CASE 
                      WHEN master_sheets.projectid IS NOT NULL THEN 'Sheet' 
                      ELSE 'System' 
                  END 
              ELSE NULL 
          END AS responseType
      FROM
          master_survey ms
      LEFT JOIN
          system_status ss ON ms.surveystatusid=ss.id
      LEFT JOIN
          master_survey_assignment msa ON ms.id=msa.surveyid
      RIGHT JOIN
          master_case_project ON ms.projectid=master_case_project.projectid
      LEFT JOIN
          master_case ON master_case_project.caseid=master_case.id
      LEFT JOIN
          platformusers pt ON master_case.platformuserid=pt.userId
      LEFT JOIN
          projects ON projects.projectId = master_case_project.projectid
      LEFT JOIN
          master_sheets ON master_sheets.projectid = projects.projectId AND master_sheets.status = 'processed'
      ${whereQuery}
      ${orderQuery};
      `;

      const surveyDetails = await sequelize.query(sqlQuery, {
        replacements: { caseId: caseId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return surveyDetails;
    } catch (error) {
      console.error('Error fetching survey details:', error);
      throw error;
    }
  },
  getSurveyById: async function (surveyId) {
    try {
      const sqlQuery = `
            SELECT
                master_survey.id as surveyId,
                CONCAT('SV-', LPAD(master_survey.surveyid, 5, '0')) AS surveyCode,
                CONCAT('PR-', LPAD(projects.projectIdentifier, 7, '0')) AS projectIdentifier,
                projects.projectCode,
                master_case_project.projectname AS projectName,
                master_case_project.spocname AS sentTo,
                master_case_project.spocemail as sentToEmail,
                CONCAT(platformusers.firstName, ' ', COALESCE(platformusers.middleName, ''), ' ', platformusers.lastName) AS senderName,
                system_status.status AS status,
                master_survey.sentdate AS sendOn,
                master_survey.closedate AS responseDate,
                master_survey_assignment.url as url,
                master_survey.modifiedtime AS lastReminderDate
            FROM
                master_survey
            LEFT JOIN
                master_survey_control on master_survey_control.id = master_survey.surveycontrolid
            LEFT JOIN
                system_status ON master_survey.surveystatusid=system_status.id
            LEFT JOIN
                master_survey_assignment  ON master_survey.id=master_survey_assignment.surveyid
			      LEFT JOIN
			          master_case_project ON master_survey.projectid=master_case_project.projectid
            LEFT JOIN
                projects ON master_survey.projectid=projects.projectId
            LEFT JOIN
                master_case on master_case.id = master_case_project.caseid
            LEFT JOIN
                platformusers on  master_case.platformuserid=platformusers.userId
            WHERE
                master_survey.id=:surveyId;
        `;

      const [surveyDetails] = await sequelize.query(sqlQuery, {
        replacements: { surveyId: surveyId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return surveyDetails;
    } catch (error) {
      console.error('Error fetching survey details:', error);
      throw error;
    }
  },

  getSurveyCaseProjectId: async function (caseProjectId) {
    try {

      const sqlQuery = `
        SELECT
            master_survey.id
        FROM
            master_survey
        JOIN
            master_survey_assignment ON master_survey_assignment.surveyid = master_survey.id
        JOIN
            master_case_project ON master_case_project.id = master_survey_assignment.caseprojectid
        WHERE
            master_case_project.id =:caseProjectId;
      `;

      const surveyId = await sequelize.query(sqlQuery, {
        replacements: { caseProjectId: caseProjectId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return surveyId != null ? surveyId[0]?.id : null;
    } catch (error) {
      console.log("Error while fetching case project id: ", error);
      throw error;
    }
  },

  getUnsentSurveys: async function (caseId) {
    try {
      const sqlQuery = `
        SELECT
            master_survey.id as surveyId,
            master_case_project.id as caseProjectId,
            projects.projectId,
            projects.projectCode,
            projects.projectName,
            master_case_project.spocname AS spocName,
            master_case_project.spocemail AS spocEmail,
            master_case_project.oldspocname AS oldSpocName,
            master_case_project.oldspocemail AS oldSpocEmail
        FROM
            master_case
        JOIN
            master_case_project ON master_case_project.caseid = master_case.id
        JOIN
            master_survey_assignment ON master_survey_assignment.caseprojectid = master_case_project.id
        JOIN
            projects ON projects.projectId = master_case_project.projectid
        LEFT JOIN
            master_survey ON master_survey.projectid = master_survey_assignment.surveyid
        WHERE
            master_case.id = :caseId
            AND master_survey.id IS NULL;
      `;

      const unSentSurveys = await sequelize.query(sqlQuery, {
        replacements: { caseId: caseId },
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return unSentSurveys;
    } catch (error) {
      console.log("Error while fetching unsent surveys list : ", error);
      throw error;
    }
  },


  getSurveyDetailsOfProject: async function (caseId, projectId) {
    try {

      const sqlQuery = `
          SELECT
              master_survey.id AS surveyId,
              master_survey_control.id AS surveyControlId,
              system_status.status AS surveyStatus,
              master_survey_assignment.id AS surveyAssignmentId
          FROM
              projects
          JOIN
              master_case_project ON master_case_project.projectid = projects.projectId
          JOIN
              master_survey_assignment ON master_survey_assignment.caseprojectid = master_case_project.id
          JOIN
              master_survey ON master_survey.id = master_survey_assignment.surveyid
          JOIN
              master_survey_control ON master_survey_control.id = master_survey.surveycontrolid
          JOIN
              system_status ON system_status.id = master_survey.surveystatusid
          WHERE
              master_case_project.projectid = '${projectId}' AND master_case_project.caseid = '${caseId}';
		
      `;

      const surveyDetails = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return surveyDetails?.length > 0 ? surveyDetails[0] : null;

    } catch (error) {
      console.log("Error while fetching survey details : ", error);
    }
  },


  updateSurveyAnswersFromSheet: async function (sheet) {
    try {

      const answers = sheet.surveyData;

      //master_survey_answer records
      let masterSurveyAnswersData = [];
      for (const key in answers) {

        const answerData = {
          id: uuidv4(),
          answer: answers[key].answer,
          surveyassignmentid: sheet.surveyAssignmentId,
          surveyquestionsid: answers[key].questionId,
          surveyid: sheet.surveyId,
          companyid: sheet.companyId,
          createdby: 'external',
          createdtime: new Date(),
          modifiedby: 'external',
          modifiedtime: new Date(),
          sysmodtime: new Date(),
          savedate: new Date()
        };

        masterSurveyAnswersData.push(answerData);
      }

      //check for existing answers and upsert
      const exitingAnswers = await caseQueries.getExistingSurveyAnswers(sheet.surveyId, sheet.surveyAssignmentId);

      for (const presentAnswer of masterSurveyAnswersData) {
        let answerExists = false;

        for (const existingAnswer of exitingAnswers) {
          if (presentAnswer.surveyquestionsid == existingAnswer.questionId) {
            await MasterSurveyAnswer.update(
              { answer: presentAnswer.answer },
              {
                where: { id: existingAnswer.answerId }
              }
            );
            answerExists = true;
            break;
          }
        }

        if (!answerExists) {
          await MasterSurveyAnswer.create(presentAnswer);
        }
      }

      //close master_survey_control
      const masterSurveyControlStatus = await SystemStatus.findOne({
        where: {
          object: 'master_survey_control',
          status: 'CLOSED'
        }
      });

      await MasterSurveyControl.update(
        { surveycontrolstatusid: masterSurveyControlStatus.dataValues.id },
        { where: { id: sheet.surveyControlId } }
      );

      //set response received for master_survey
      const masterSurveyStatus = await SystemStatus.findOne({
        where: {
          object: 'master_survey',
          status: 'RESPONSE RECEIVED'
        }
      });

      await MasterSurvey.update(
        {
          surveystatusid: masterSurveyStatus.dataValues.id,
          closedate: new Date(),
          aistatus: 'unprocessed'
        },
        { where: { id: sheet.surveyId } }
      );

      console.log("Survey Response Received | Type : Sheet | Project ID " + sheet.projectId + " | Uploaded By " + sheet.userName);

      return {
        status: "processed"
      }


    } catch (error) {
      console.log("Error while saving survey answers : ", error);
      return {
        status: "failed",
        message: "Internal Server Error"
      }
    }
  },

  getExistingSurveyAnswers: async function (surveyId, surveyAssignmentId) {
    try {

      const sqlQuery = `
         SELECT
              master_survey_answer.id AS answerId,
              system_survey_question.id AS questionId
          FROM
              master_survey_answer
          JOIN
              system_survey_question ON system_survey_question.id = master_survey_answer.surveyquestionsid
          WHERE
              master_survey_answer.surveyid = '${surveyId}' AND master_survey_answer.surveyassignmentid = '${surveyAssignmentId}';
      `;

      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;

    } catch (error) {
      console.log('Error while fetching exisiting answers : ', error);
    }
  },

  getProjectSurveyQuestions: async function (projectCode, companyId) {
    try {

      const project = await Project.findOne({
        where: {
          projectCode: projectCode,
          companyId: companyId
        }
      });

      const projectId = project.dataValues.projectId;

      const sqlQuery = `
         SELECT
              system_survey_question.*
          FROM
              projects
          JOIN
              master_survey ON projects.projectId = master_survey.projectid
          JOIN
              system_survey_template ON master_survey.surveyquestionstemplateid = system_survey_template.id
          JOIN
              system_survey_question ON system_survey_template.id = system_survey_question.surveytemplateid
          WHERE
              master_survey.projectid = '${projectId}';
      `;

      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;

    } catch (error) {
      console.log('Error while fetching exisiting answers : ', error);
    }
  },


  //interaction uplaod
   getIntearctionDetailsOfProject: async function (interactionId, projectId) {
    try {

      const sqlQuery = `
          SELECT
              master_survey.id AS surveyId,
              master_survey_control.id AS surveyControlId,
              system_status.status AS surveyStatus,
              master_survey_assignment.id AS surveyAssignmentId
          FROM
              projects
          JOIN
              master_case_project ON master_case_project.projectid = projects.projectId
          JOIN
              master_survey_assignment ON master_survey_assignment.caseprojectid = master_case_project.id
          JOIN
              master_survey ON master_survey.id = master_survey_assignment.surveyid
          JOIN
              master_survey_control ON master_survey_control.id = master_survey.surveycontrolid
          JOIN
              system_status ON system_status.id = master_survey.surveystatusid
          WHERE
              master_case_project.projectid = '${projectId}' AND master_case_project.interactionid = '${interactionId}';
		
      `;

      const surveyDetails = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return surveyDetails?.length > 0 ? surveyDetails[0] : null;

    } catch (error) {
      console.log("Error while fetching survey details : ", error);
    }
  },
   updateInteractionAnswersFromSheet: async function (sheet) {
    try {

      const answers = sheet.surveyData;

      //master_survey_answer records
      let masterSurveyAnswersData = [];
      for (const key in answers) {

        const answerData = {
          id: uuidv4(),
          answer: answers[key].answer,
          surveyassignmentid: sheet.surveyAssignmentId,
          surveyquestionsid: answers[key].questionId,
          surveyid: sheet.surveyId,
          companyid: sheet.companyId,
          createdby: 'external',
          createdtime: new Date(),
          modifiedby: 'external',
          modifiedtime: new Date(),
          sysmodtime: new Date(),
          savedate: new Date()
        };

        masterSurveyAnswersData.push(answerData);
      }

      //check for existing answers and upsert
      const exitingAnswers = await caseQueries.getExistingInteractionAnswers(sheet.surveyId, sheet.surveyAssignmentId);

      for (const presentAnswer of masterSurveyAnswersData) {
        let answerExists = false;

        for (const existingAnswer of exitingAnswers) {
          if (presentAnswer.surveyquestionsid == existingAnswer.questionId) {
            await MasterSurveyAnswer.update(
              { answer: presentAnswer.answer },
              {
                where: { id: existingAnswer.answerId }
              }
            );
            answerExists = true;
            break;
          }
        }

        if (!answerExists) {
          await MasterSurveyAnswer.create(presentAnswer);
        }
      }

      //close master_survey_control
      const masterSurveyControlStatus = await SystemStatus.findOne({
        where: {
          object: 'master_survey_control',
          status: 'CLOSED'
        }
      });

      await MasterSurveyControl.update(
        { surveycontrolstatusid: masterSurveyControlStatus.dataValues.id },
        { where: { id: sheet.surveyControlId } }
      );

      //set response received for master_survey
      const masterSurveyStatus = await SystemStatus.findOne({
        where: {
          object: 'master_interaction',
          status: 'RESPONSE RECEIVED'
        }
      });

      await MasterSurvey.update(
        {
          surveystatusid: masterSurveyStatus.dataValues.id,
          closedate: new Date(),
          aistatus: 'unprocessed'
        },
        { where: { id: sheet.surveyId } }
      );

      console.log("Intreaction Response Received | Type : Sheet | Project ID " + sheet.projectId + " | Uploaded By " + sheet.userName);

      return {
        status: "processed"
      }


    } catch (error) {
      console.log("Error while saving intearction answers : ", error);
      return {
        status: "failed",
        message: "Internal Server Error"
      }
    }
  },

  getExistingInteractionAnswers: async function (surveyId, surveyAssignmentId) {
    try {

      const sqlQuery = `
         SELECT
              master_survey_answer.id AS answerId,
              system_survey_question.id AS questionId
          FROM
              master_survey_answer
          JOIN
              system_survey_question ON system_survey_question.id = master_survey_answer.surveyquestionsid
          WHERE
              master_survey_answer.surveyid = '${surveyId}' AND master_survey_answer.surveyassignmentid = '${surveyAssignmentId}';
      `;

      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;

    } catch (error) {
      console.log('Error while fetching exisiting answers : ', error);
    }
  },

  getProjectInteractionQuestions: async function (projectCode, companyId) {
    try {

      const project = await Project.findOne({
        where: {
          projectCode: projectCode,
          companyId: companyId
        }
      });

      const projectId = project.dataValues.projectId;

      const sqlQuery = `
         SELECT
              system_survey_question.*
          FROM
              projects
          JOIN
              master_survey ON projects.projectId = master_survey.projectid
          JOIN
              system_survey_template ON master_survey.surveyquestionstemplateid = system_survey_template.id
          JOIN
              system_survey_question ON system_survey_template.id = system_survey_question.surveytemplateid
          WHERE
              master_survey.projectid = '${projectId}';
      `;

      const data = await sequelize.query(sqlQuery, {
        type: Sequelize.QueryTypes.SELECT,
        raw: true
      });

      return data;

    } catch (error) {
      console.log('Error while fetching exisiting answers : ', error);
    }
  },

};

module.exports = caseQueries;
