const { Sequelize, Op } = require("sequelize");
const sequelize = require("../setups/db");

const surveyQueries = {

  getSurveyQuestionsForExcel: async function (surveyId) {
    try {
      const query = `
          SELECT
              system_survey_question.question,
              system_survey_question.description
          FROM
	            master_survey
          JOIN
              system_survey_template ON master_survey.surveyquestionstemplateid = system_survey_template.id
          JOIN
              system_survey_question ON system_survey_template.id = system_survey_question.surveytemplateid
          WHERE
              master_survey.id = :surveyId
          ORDER BY
              system_survey_question.sequence;
    `;

      const questions = await sequelize.query(query, {
        replacements: { surveyId: surveyId },
        type: sequelize.QueryTypes.SELECT,
      });

      return questions;
    } catch (error) {
      console.error("Error fetching cases with same composition:", error);
      throw error;
    }
  },

  getSurveyDetails: async function (surveyId) {
    try {
      const query = `
              SELECT
              master_survey.sentdate as sentDate,
              master_survey.surveyid,
              master_survey_control.id as surveyControlId,
              master_survey_assignment.url,
              -- master_case_project.projectId as projectId,
              projects.projectCode as projectId,
              projects.accountingYear,
              master_case_project.projectmanager as projectManager,
              master_case_project.technicalcontact as technicalContact,
              master_case_project.spocname as name,
              master_case_project.spocemail AS userEmail,
              master_case.accountingyear as assesmentYear,
              CONCAT(sender.firstName, ' ', COALESCE(sender.middleName, ''), ' ', sender.lastName) AS createdBy,
              sender.email AS sentBy,
              projects.projectName,
              projects.description,
              company.companyId,
              company.companyName as clientName,
              company.disclaimer,
              surveyControl.status as surveyControlStatus,
              survey.status as surveyStatus
              FROM master_survey
              LEFT JOIN master_survey_control ON master_survey_control.id = master_survey.surveycontrolid
              LEFT JOIN system_status as surveyControl ON surveyControl.id = master_survey_control.surveycontrolstatusid
              LEFT JOIN system_status as survey ON survey.id = master_survey.surveystatusid
              LEFT JOIN company ON company.companyId = master_survey.companyid
              LEFT JOIN master_survey_assignment ON master_survey_assignment.surveyid = master_survey.id
              LEFT JOIN master_case_project on master_case_project.id = master_survey_assignment.caseprojectid
              LEFT JOIN master_case ON master_case.id = master_case_project.caseid
              LEFT JOIN platformusers AS sender ON sender.userid = master_case.platformuserid
              LEFT JOIN projects on projects.projectId = master_survey.projectid
              WHERE master_survey.id = :surveyId;
            `;

      const surveyDetails = await sequelize.query(query, {
        replacements: { surveyId: surveyId },
        type: sequelize.QueryTypes.SELECT,
      });

      return surveyDetails[0];
    } catch (error) {
      console.error("Error fetching cases with same composition:", error);
      throw error;
    }
  },

  getSurveyQuestionAndAnswers: async function (surveyId) {
    try {
      const query = `
                  SELECT
                  system_survey_question.id AS questionId,
                  system_survey_question.question,
                  system_survey_question.description as info,
                  master_survey_answer.answer,
                  master_survey_answer.saveddate as lastSaved,
                  system_survey_question.sequence
              FROM master_survey
              JOIN system_survey_template ON system_survey_template.id = master_survey.surveyquestionstemplateid
              JOIN system_survey_question ON system_survey_question.surveytemplateid  = system_survey_template.id
              LEFT JOIN master_survey_answer ON master_survey_answer.surveyquestionsid = system_survey_question.id
                  AND master_survey_answer.surveyid = :surveyId
              WHERE master_survey.id = :surveyId
              ORDER BY system_survey_question.sequence ;
            `;

      const surveyDetails = await sequelize.query(query, {
        replacements: { surveyId: surveyId },
        type: sequelize.QueryTypes.SELECT,
      });

      return surveyDetails;
    } catch (error) {
      console.error("Error fetching cases with same composition:", error);
      throw error;
    }
  },

};

module.exports = surveyQueries;
