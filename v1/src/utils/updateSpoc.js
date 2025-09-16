const Project = require("../models/project.model");
const SystemStatus = require("../models/system-status.model");
const MasterInteractions = require("../models/master-interactions.model");
const MasterCaseProject = require("../models/master-case-project.model");
const caseQueries = require("../queries/case.queries");
const MasterSurvey = require("../models/master-survey.model");

const updateProjectSpoc = async (ids, spocName, spocEmail) => {
    try {

        for (const projectId of ids) {
            const project = await Project.findOne({ where: { projectId: projectId } });
            await Project.update(
                {
                    spocName: spocName,
                    spocEmail: spocEmail,
                    oldSpocName: project.dataValues.spocName,
                    oldSpocEmail: project.dataValues.spocEmail
                },
                {
                    where: {
                        projectId: projectId
                    }
                }
            );
        }

        console.log("Projects spoc details updated successfully");
    } catch (error) {
        console.log("Error while updating projects spoc ", error);
        throw error;
    }
}

const updateInteractionSpoc = async (ids, spocName, spocEmail) => {
    try {

        const status = await SystemStatus.findOne({
            where: {
                object: 'master_interactions',
                status: 'NOT SENT'
            }
        });

        for (const interactionId of ids) {
            const masterInteraction = await MasterInteractions.findOne({ where: { id: interactionId } });

            await MasterInteractions.update(
                {
                    spocname: spocName,
                    spocemail: spocEmail,
                    oldspocname: masterInteraction.dataValues.spocname,
                    oldspocemail: masterInteraction.dataValues.spocemail,
                    otp: null,
                    statusid: status.dataValues.id
                },
                {
                    where: {
                        id: interactionId
                    }
                }
            );
        }

        console.log("Interactions spoc details updated successfully");

    } catch (error) {
        console.log("Error while updating interactions spoc ", error);
        throw error;
    }
}

const updateSurveySpoc = async (ids, spocName, spocEmail) => {
    try {

        for (const caseProjectId of ids) {

            const caseProject = await MasterCaseProject.findOne({
                where: {
                    id: caseProjectId,
                }
            });

            const surveyId = await caseQueries.getSurveyCaseProjectId(caseProjectId);

            if (surveyId) {
                await MasterSurvey.update(
                    {
                        spocname: spocName,
                        spocemail: spocEmail,
                    },
                    {
                        where: {
                            id: surveyId,
                        },
                    }
                );
            }

            await MasterCaseProject.update(
                {
                    spocname: spocName,
                    spocemail: spocEmail,
                    oldspocname: caseProject.dataValues.spocname,
                    oldspocemail: caseProject.dataValues.spocemail
                },
                {
                    where: {
                        id: caseProjectId
                    }
                }
            );
        }

        console.log("Survey spoc details updated successfully");

    } catch (error) {
        console.log("Error while updating surveys spoc ", error);
        throw error;
    }
}

module.exports = {
    updateProjectSpoc,
    updateInteractionSpoc,
    updateSurveySpoc
}