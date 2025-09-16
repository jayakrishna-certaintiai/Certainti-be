const { Sequelize, Op } = require("sequelize");
const sequelize = require("../setups/db");
const MasterInteractionsQA = require("../models/master-interactions-qa.model");
const MasterInteractions = require("../models/master-interactions.model");
const SystemStatus = require("../models/system-status.model");

const assessmentQueries = {
    getUncreatedInteractions: async function () {
        try {
            const query = `
                SELECT
                    subQuery.*
                FROM
                    (SELECT
                            master_project_ai_assessment.id AS assessmentId,
                            master_interactions.id AS interactionId,
                            master_project_ai_assessment.companyId AS companyId,
                            master_project_ai_assessment.projectId AS projectId
                    FROM
                            master_project_ai_assessment
                    LEFT JOIN
                            master_interactions ON master_interactions.assessmentid = master_project_ai_assessment.id) AS subQuery
                WHERE
                    subQuery.interactionId IS NULL;
            `;

            const assessmentIds = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT,
            });

            return assessmentIds;
        } catch (error) {
            console.error("Error fetching unsent interactions:", error);
            throw error;
        }
    },

    getUncreatedInteractionOfProject: async function (projectIdentifier, assessmentId) {
        try {
            const query = `
               
                        SELECT
                                master_project_ai_assessment.id AS assessmentId,
                                master_interactions.id AS interactionId,
                                master_project_ai_assessment.companyId AS companyId,
                                master_project_ai_assessment.projectId AS projectId
                        FROM
                                master_project_ai_assessment
                        LEFT JOIN
                                master_interactions ON master_interactions.assessmentid = master_project_ai_assessment.id
                        WHERE
                                master_project_ai_assessment.projectId = :projectIdentifier AND master_project_ai_assessment.id = :assessmentId;
                    
            `;

            const assessmentIds = await sequelize.query(query, {
                replacements: { projectIdentifier: projectIdentifier, assessmentId: assessmentId },
                type: sequelize.QueryTypes.SELECT,
            });

            return assessmentIds;
        } catch (error) {
            console.error("Error fetching unsent interactions:", error);
            throw error;
        }
    },

    getUnsentInteractions: async function () {
        try {
            const query = `
                SELECT
                        master_interactions.id,
                        master_interactions.url,
                        master_interactions.interactionsid,
                        master_interactions.projectidentifier,
                        projects.projectName,
                        projects.projectCode,
                        projects.spocName,
                        projects.spocEmail,
                        projects.accountingYear
                FROM
                        master_interactions
                JOIN
                        system_status ON system_status.id = master_interactions.statusid
                JOIN
                        projects ON projects.projectId = master_interactions.projectidentifier
                WHERE
                        system_status.status = 'CREATED';
            `;

            const interactions = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT,
            });

            return interactions;
        } catch (error) {
            console.error("Error fetching unsent interactions:", error);
            throw error;
        }
    },

    getUnsentInteractionsByUser: async function (interactionIds) {
        try {
            const query = `
                SELECT
                        master_interactions.id,
                        master_interactions.url,
                        master_interactions.interactionsid,
                        master_interactions.projectidentifier,
                        projects.projectName,
                        projects.projectCode,
                        master_interactions.spocname AS spocName,
                        master_interactions.spocemail AS spocEmail,
                        projects.accountingYear,
                        system_status.status,
                        projects.projectId,
                        company.companyId,
                        company.companyName,
                        company.fiscalYear,
                        company.interactionccMails,
                        projects.interactionCCMails
                FROM
                        master_interactions
                JOIN
                        system_status ON system_status.id = master_interactions.statusid
                JOIN
                        projects ON projects.projectId = master_interactions.projectidentifier
                JOIN
                        company ON company.companyId = projects.companyId
                WHERE
                        master_interactions.id IN (:interactionIds);
            `;

            const interactions = await sequelize.query(query, {
                replacements: { interactionIds: interactionIds },
                type: sequelize.QueryTypes.SELECT,
            });

            return interactions;
        } catch (error) {
            console.error("Error fetching unsent interactions:", error);
            throw error;
        }
    },

    getQuestionsAndAnswers: async function (interactionId) {
        try {
            const query = `
                  SELECT
                        master_interactions_qa.id as questionId,
                        master_interactions_qa.question,
                        master_interactions_qa.answer,
                        master_interactions_qa.modifiedtime as lastSaved
                    FROM
                        master_interactions_qa
                    JOIN
                        master_interactions ON master_interactions.id = master_interactions_qa.interactionsid
                    WHERE
                        master_interactions_qa.interactionsid = :interactionId;
            `;

            const questions = await sequelize.query(query, {
                replacements: { interactionId: interactionId },
                type: sequelize.QueryTypes.SELECT,
            });

            return questions;
        } catch (error) {
            console.error("Error fetching questions and answers:", error);
            throw error;
        }
    },


    getInteractionDetails: async function (assessmentId) {
        try {
            const query = `
                SELECT
                    master_project_ai_assessment.intent_framework_id AS intentFrameworkId,
                    master_project_ai_interaction.interaction AS intent,
                    master_project_ai_interaction.id AS aiInteractionId
                FROM
                    master_project_ai_interaction
                JOIN
                    master_project_ai_assessment ON master_project_ai_assessment.id = master_project_ai_interaction.project_ai_assessment_id
                WHERE
                    master_project_ai_interaction.project_ai_assessment_id = :assessmentId;
            `;

            const interactionDetails = await sequelize.query(query, {
                replacements: { assessmentId: assessmentId },
                type: sequelize.QueryTypes.SELECT,
            });

            return interactionDetails;
        } catch (error) {
            console.error("Error fetching interaction details:", error);
            throw error;
        }
    },

    getInteractionById: async function (interactionId) {
        try {
            const interactionDetailsQuery = `
                   SELECT
                        master_interactions_qa.id as id,
                        master_interactions_qa.question,
                        master_interactions_qa.answer
                    FROM
                        master_interactions_qa
                    JOIN
                        master_interactions ON master_interactions.id = master_interactions_qa.interactionsid
                    WHERE
                        master_interactions.id = :interactionId;
            `;

            const interactionInformationQuery = `
            SELECT
                master_interactions.interactionsid AS interactionIdentifier,
                master_interactions.id AS interactionId,
                master_interactions.spocname AS sentTo,
                CASE
                    WHEN system_status.status = 'NOT SENT' THEN NULL
                    ELSE master_interactions.createdtime
                END AS sentDate,
                CASE
                    WHEN system_status.status = 'RESPONSE RECEIVED' THEN master_interactions.modifiedtime
                    ELSE NULL
                END AS responseDate,
                system_status.status AS status,
                projects.projectId,
                projects.projectName,
                projects.projectCode
            FROM
                master_interactions
            JOIN
                system_status ON system_status.id = master_interactions.statusid
            JOIN
                projects ON projects.projectId = master_interactions.projectidentifier
            WHERE
                master_interactions.id = :interactionId;
        `;


            const interactionDetails = await sequelize.query(interactionDetailsQuery, {
                replacements: { interactionId: interactionId },
                type: sequelize.QueryTypes.SELECT,
            });

            const interactionInformation = await sequelize.query(interactionInformationQuery, {
                replacements: { interactionId: interactionId },
                type: sequelize.QueryTypes.SELECT,
            });

            const data = {
                interactionDetails: interactionDetails,
                interactionInformation: interactionInformation
            }
            return data;
        } catch (error) {
            console.error("Error fetching interaction details:", error);
            throw error;
        }
    },

    //interaction uplaod sheet
    updateInteractionAnswersFromSheet: async function (sheet) {
        try {
            const answers = sheet.intearctionData;
            const interactionId = sheet.interactionId;

            //master_intearction_answer records
            for (const record of answers) {
                const id = record.questionId;
                const answer = record.answer;

                await MasterInteractionsQA.update(
                    { answer: answer, aistatus: 'unprocessed' },
                    { where: { id: id } }
                );
            }

            //get statusid for object master_interaction and status=RESPONSE RECEIVED
            const statusRecord = await SystemStatus.findOne({
                where: {
                    object: "master_interactions",
                    status: "RESPONSE RECEIVED",
                },
                attributes: ["id"],
            });

            //change interaction status to closed
            await MasterInteractions.update(
                {
                    statusid: statusRecord.dataValues.id,
                    modifiedtime: new Date()
                },
                { where: { id: interactionId } }
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
};


module.exports = assessmentQueries;
