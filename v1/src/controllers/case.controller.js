const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const MasterCase = require("../models/master-case.model");
const { v4: uuidv4 } = require("uuid");
const caseQueries = require("../queries/case.queries");
const MasterCaseProjects = require("../models/master-case-project.model");
const SystemType = require("../models/system-type.model");
const SystemRole = require("../models/system-role.model");
const SystemStatus = require("../models/system-status.model");
const MasterSurveyControl = require("../models/master-survey-control.model");
const MasterSurvey = require("../models/master-survey.model");
const MasterSurveyAssignment = require("../models/master-survey-assignment.model");
const crypto = require("../utils/crypto");
const { sendFile, sendMail } = require("../utils/mailGraphApi");
const SystemSurveyTemplate = require("../models/system-survey-template.model");
const { Sequelize, Op } = require("sequelize");
const { literal } = Sequelize;;
const surveyQueries = require("../queries/survey.queries");
const Project = require("../models/project.model");
const { createCSVforSurvey, createExcelFile, objectToDocument } = require("../utils/csv");
const Company = require("../models/company.model");
const fs = require('fs').promises;
const { surveySheetsProcessor } = require("../utils/fileToDatabase");
const companyQueries = require('../queries/company.queries');
const { SURVEY_TIER_QUESTIONS } = require("../constants");
const SystemSurveyQuestion = require("../models/system-survey-question.model");


const getCaseProjects = async (req, res) => {
    try {
        const { caseId } = req.params;
        const headers = req.headers;
        // console.log("header",headers);

        const caseProjects = await caseQueries.getCaseProjects(caseId);

        return res
            .status(200)
            .json(
                new ApiResponse(caseProjects, "Projects retrieved successfully.", true)
            );
    } catch (error) {
        return res.status(500).json(new ApiResponse(null, error.message, false));
    }
};

const getCaseFilterValues = async (req, res) => {
    try {
        const data = await caseQueries.getCaseFilterValues();
        return res.status(200).json(new ApiResponse(data, "Case filters values fetched successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getSurveysFilterValues = async (req, res) => {
    try {
        const { caseId } = req.query;

        const data = await caseQueries.getSurveysFilterValues(caseId);

        return res.status(200).json(new ApiResponse(data, "Survey filters values fetched successfully.", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getCaseTypes = async (req, res) => {
    try {
        const data = await SystemType.findAll({
            attributes: [
                ["id", "caseTypeId"],
                ["type", "caseType"],
                ["description", "description"],
                ["sequence", "sequence"],
            ],
            where: {
                object: "master_case",
            },
            order: [
                ["sequence", "ASC"], // ASC for ascending order, DESC for descending order
            ],
        });

        return res
            .status(200)
            .json(new ApiResponse(data, "Case Types fetched successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getCaseRoles = async (req, res) => {
    try {
        const data = await SystemRole.findAll({
            attributes: [
                ["id", "caseRoleId"],
                ["role", "caseRoleName"],
                ["description", "description"],
                ["sequence", "sequence"],
            ],
            where: {
                object: "master_case_team_member",
            },
            order: [
                ["sequence", "ASC"], // ASC for ascending order, DESC for descending order
            ],
        });

        return res
            .status(200)
            .json(new ApiResponse(data, "Case Roles fetched successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const createCase = async (req, res) => {
    try {
        // Extract case details from request body
        const { caseDetails, forceCaseCreate } = req.body;

        const data = {};

        // Define the required fields for creating a case
        const requiredFields = [
            "casetypeid",
            "companyid",
        ];

        // Construct case data
        const caseData = {
            id: uuidv4(),
            summary: caseDetails.caseSummary || null,
            description: caseDetails.caseDescription || null,
            casecompletionstrategy: caseDetails.caseCompletionStrategy || null,
            additionalinformation: caseDetails.additionalInformation || null,
            accountingyear: caseDetails.accountingYear || null,
            assessmentyear: caseDetails.assessmentYear || null,
            fiscalyear: caseDetails.accountingYear || null,
            datacollectioncompletiondate: caseDetails.dataCollectionCompletionDate || null,
            reportgenerationdate: caseDetails.reportGenerationDate || null,
            submissiondate: caseDetails.submissionDate || null,

            platformuserid: req.params.user,
            companyid: req.params.companyId,
            casetypeid: caseDetails.caseTypeId,
            createdby: req.params.user,
            createdtime: new Date(),
            modifiedby: req.params.user,
            modifiedtime: new Date(),
            sysmodtime: new Date(),
        };

        // Validate required fields
        const compositionFields = [];
        for (const field of requiredFields) {
            if (!caseData[field]) {
                return res
                    .status(400)
                    .json(
                        new ApiResponse(
                            null,
                            `Required field '${field}' is missing.`,
                            false
                        )
                    );
            }
            compositionFields.push(caseData[field]);
        }

        // Check for cases exists with required fields
        const casesWithSameComposition =
            await caseQueries.getCasesWithSameComposition(
                requiredFields,
                compositionFields
            );
        if (casesWithSameComposition.length > 0) {
            data.casesWithSameComposition = casesWithSameComposition;
            data.caseCompositionExists = true;
            if (!forceCaseCreate) {
                return res
                    .status(200)
                    .json(
                        new ApiResponse(
                            data,
                            "Cannot create case with the same composition.",
                            false
                        )
                    );
            }
        }

        // Create the case
        const createdCase = await MasterCase.create(caseData);
        data.caseData = createdCase;


        return res
            .status(200)
            .json(new ApiResponse(data, "Case created successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getCase = async (req, res) => {
    try {
        const caseId = req.params.caseId;
        if (!caseId) {
            return res.status(400).json(new ApiResponse(null, "Case Id missing"));
        }

        const ifCaseExists = await MasterCase.findOne({ where: { id: caseId } });
        if (!ifCaseExists) {
            return res.status(404).json(new ApiResponse(null, "Case not found"));
        }

        const casedetails = await caseQueries.findCaseById(caseId);

        const data = {
            casedetails: casedetails,
        };

        return res
            .status(200)
            .json(new ApiResponse(data, "Cases fetched successfully."));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getAllCases = async (req, res) => {
    try {

        const { companyIds, sortField, sortOrder, countryName, caseOwners } = req.query;

        const filter = {
            companyIds: companyIds ? JSON.parse(companyIds.replace(/'/g, '"')) : null,
            locations: countryName ? JSON.parse(countryName.replace(/'/g, '"')) : null,
            caseOwners: caseOwners ? JSON.parse(caseOwners.replace(/'/g, '"')) : null
        }

        const caseDetails = await caseQueries.getAllCasesWithDetails(sortField, sortOrder, filter);
        const data = { caseDetails: caseDetails };
        return res
            .status(200)
            .json(new ApiResponse(data, "Cases fetched successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};


const addProjectsToCase = async (req, res) => {
    try {
        const caseId = req.body.caseId;
        const userId = req.params.user;
        const projectIds = req.body.projectIds;

        //get the case
        const masterCase = await MasterCase.findOne({
            where: {
                id: caseId
            }
        });

        if (!masterCase) {
            return res.status(400).json(new ApiResponse(null, "Invalid case Id.", false));

        }

        //validate request projects
        if (!projectIds) {
            return res.status(400).json(new ApiResponse(null, "Projects Ids Missing.", false));
        }

        //get existing case nad projects combinations
        const existingProjects = await MasterCaseProjects.findAll({
            where: {
                caseid: caseId,
                projectid: projectIds
            }
        });

        const existingProjectIds = existingProjects.map(project => project.projectid);

        //these are the new projects to add to a case
        const newCaseProjectIds = projectIds.filter(projectId => !existingProjectIds.includes(projectId));

        //list for master case projects
        let masterCaseProjectsDataToInsert = [];

        for (const projectId of newCaseProjectIds) {

            //find the project by id
            const project = await Project.findOne({
                where: {
                    projectId: projectId
                }
            });

            const masterCaseProjectData = {
                id: uuidv4(),
                caseid: caseId,
                projectname: project.dataValues.projectName,
                projectid: project.dataValues.projectId,
                projectmanager: project.dataValues.projectManager,
                technicalcontact: project.dataValues.technicalContact,
                spocname: project.dataValues.spocName,
                spocemail: project.dataValues.spocEmail,
                totalefforts: project.dataValues.totalEfforts,
                totalcosts: project.dataValues.totalCosts,
                totalrndefforts: project.dataValues.totalRnDEfforts,
                totalrndcosts: project.dataValues.totalRnDCosts,
                companyid: masterCase.dataValues.companyid,
                createdby: userId,
                createdtime: new Date()
            }

            masterCaseProjectsDataToInsert.push(masterCaseProjectData);

        }

        //save the records
        await MasterCaseProjects.bulkCreate(masterCaseProjectsDataToInsert);

        return res
            .status(200)
            .json(new ApiResponse(null, "Project added to case successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiResponse(null, error.message, false));
    }
};


const removeCaseProjects = async (req, res) => {
    try {
        const { caseprojectid } = req.params;

        const project = await MasterCaseProjects.findOne({
            where: {
                id: caseprojectid,
            },
        });

        if (!project) {
            return res.status(404).json(new ApiResponse(null, "Project not found.", false));
        }

        const caseAssignment = await MasterSurveyAssignment.findOne({
            where: {
                caseprojectid: caseprojectid,
            },
        });

        // If it exists, remove it from master_case_assignment
        if (caseAssignment) {
            await MasterSurveyAssignment.destroy({
                where: {
                    caseprojectid: caseprojectid,
                },
            });
        }


        // Delete the project
        await project.destroy();
        return res
            .status(200)
            .json(
                new ApiResponse(null, "Project removed from case successfully.", true)
            );
    } catch (error) {
        return res.status(500).json(new ApiResponse(null, error.message, false));
    }
};


const getSurvey = async (req, res) => {
    try {

        const {
            projectIds,
            status,
            sentStartDate,
            sentEndDate,
            responseReceivedStartDate,
            responseReceivedEndDate,
            startAge,
            endAge,
            sentBy,
            sentTo,
            caseProjectIds,
            caseProjectCodes,
            caseProjectNames,
            sortField,
            sortOrder
        } = req.query;

        const filter = {
            projectIds: projectIds ? JSON.parse(projectIds.replace(/'/g, '"')) : null,
            status: status ? JSON.parse(status.replace(/'/g, '"')) : null,
            sentStartDate: sentStartDate ? sentStartDate : null,
            sentEndDate: sentEndDate ? sentEndDate : null,
            responseReceivedStartDate: responseReceivedStartDate ? responseReceivedStartDate : null,
            responseReceivedEndDate: responseReceivedEndDate ? responseReceivedEndDate : null,
            sentBy: sentBy ? JSON.parse(sentBy.replace(/'/g, '"')) : null,
            sentTo: sentTo ? JSON.parse(sentTo.replace(/'/g, '"')) : null,
            caseProjectIds: caseProjectIds ? JSON.parse(caseProjectIds.replace(/'/g, '"')) : null,
            caseProjectCodes: caseProjectCodes ? JSON.parse(caseProjectCodes.replace(/'/g, '"')) : null,
            caseProjectNames: caseProjectNames ? JSON.parse(caseProjectNames.replace(/'/g, '"')) : null,
            caseId: req.params.caseId
        };

        const sort = {
            sortField,
            sortOrder
        };

        const caseId = req.params.caseId;
        let surveys = await caseQueries.getSurveyList(caseId, filter, sort);

        //sort for age
        if (sortField && sortOrder && sortField == 'age') {
            surveys = sortOrder == 'asc' ? surveys.sort((a, b) => a.age - b.age) : surveys.sort((a, b) => b.age - a.age);
        }

        let counts = {
            totalSurveysSent: 0,
            totalSurveysNotSent: 0,
            totalResponsesReceived: 0,
            totalRemindersSent: 0
        };

        const toTitleCase = (str) => {
            return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };

        let surveyResponseData = [];
        let unSentSurveys = [];

        surveys.forEach(survey => {
            // Count different statuses
            switch (survey.status) {
                case 'SENT':
                    counts.totalSurveysSent++;
                    break;
                case 'RESPONSE RECEIVED':
                    counts.totalResponsesReceived++;
                    counts.totalSurveysSent++;
                    break;
                case 'REMINDER SENT':
                    counts.totalRemindersSent++;
                    counts.totalSurveysSent++;
                    break;
                case 'GRANTED':
                    counts.totalSurveysSent++;
                    break;
                case 'REVOKED':
                    counts.totalSurveysSent++;
                    break;
                default:
                    counts.totalSurveysNotSent++;
            }

            // Convert status to title case
            if (survey.status) {
                survey.status = toTitleCase(survey.status);
                surveyResponseData.push(survey);
            }
            else {
                unSentSurveys.push(survey);
            }
        });

        if (startAge || endAge) {
            surveyResponseData = surveyResponseData.filter(item => item.age >= startAge && item.age <= endAge);
        }

        const data = {
            counts,
            data: surveyResponseData,
            unSentSurveys: unSentSurveys
        };

        return res
            .status(200)
            .json(
                new ApiResponse(data, "survey details fetched successfully ", true)
            );
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const sendSurveys = async (req, res) => {
    try {
        const userId = req.params.user;
        const caseId = req.params.caseId;
        const caseProjectIds = req.body.caseProjectIds;

        //check request
        if (!caseId) {
            return res.status(400).json(new ApiError('Case Id missing', 400));
        }

        if (!caseProjectIds || caseProjectIds.length == 0) {
            return res
                .status(400)
                .json(new ApiResponse(null, "Case project ids missing."), false);
        }

        //get survey control status from survey status for status = Open
        const surveyControlSystemStatus = await SystemStatus.findOne({
            where: {
                object: "master_survey_control",
                status: "OPEN",
            },
            attributes: ["id"], // Only select the `id` field
        });

        //get company id from caseId
        const masterCase = await MasterCase.findOne({
            where: {
                id: caseId,
            },
            attributes: ["companyid"], // Only select the `companyid` field
        });

        if (!masterCase) {
            return res.status(404).json(new ApiError('Case/Project not found', 404));
        }

        let company = await Company.findOne({
            where: {
                companyId: masterCase.dataValues.companyid
            }
        });

        // Find latest template by created time
        let systemSurveyTemplate = await SystemSurveyTemplate.findOne({
            attributes: ["id"],
            where: {
                companyid: masterCase.dataValues.companyid,
                tier: process.env.ACTIVE_SURVEY_TEMPLATE,
                description: '8 Questions' // <-- ADD THIS
            },
            order: [['createdtime', 'DESC']]
        });
        // add templte and question
        if (!systemSurveyTemplate) {
            const activeTierTemplate = SURVEY_TIER_QUESTIONS[process.env.ACTIVE_SURVEY_TEMPLATE];
            //create a template for company
            const templateData = {
                id: uuidv4(),
                tier: process.env.ACTIVE_SURVEY_TEMPLATE,
                description: `${activeTierTemplate.template.questionsCount} Questions`,
                createdby: 'system',
                modifiedby: 'system',
                createdtime: new Date(),
                modifiedtime: new Date(),
                sysmodtime: new Date(),
                companyid: masterCase.dataValues.companyid
            }
            await SystemSurveyTemplate.create(templateData);

            //create answers
            let questionsData = [];
            for (const defaultQuestion of activeTierTemplate.questions) {
                const questionData = {
                    id: uuidv4(),
                    question: defaultQuestion.question,
                    sequence: defaultQuestion.sequence,
                    description: defaultQuestion.description,
                    surveytemplateid: templateData.id,
                    createdby: 'system',
                    modifiedby: 'system',
                    createdtime: templateData.createdtime,
                    modifiedtime: templateData.modifiedtime,
                    sysmodtime: templateData.sysmodtime
                }
                if (questionData.sequence == 1) {
                    questionData.question = questionData.question.replace('${year1}', company.dataValues.fiscalYear - 1);
                    questionData.question = questionData.question.replace('${year2}', company.dataValues.fiscalYear);
                }
                questionsData.push(questionData);
            }
            await SystemSurveyQuestion.bulkCreate(questionsData);
        }
        systemSurveyTemplate = await SystemSurveyTemplate.findOne({
            attributes: ["id"], // Only select the `id` field
            where: {
                companyid: masterCase.dataValues.companyid, // Replace 'CID' with the actual company ID
                tier: process.env.ACTIVE_SURVEY_TEMPLATE
            }
        });

        //get cc mails
        let companyCCMails = company.dataValues.ccmails;
        companyCCMails = companyCCMails ? companyCCMails.split(',') : [];

        //send surveys for all case project ids
        for (const caseProjectId of caseProjectIds) {
            //check wheather there is a survey exists for the caseProjectId
            //get projectId from master_case_projects using case_project
            const mastercaseProject = await MasterCaseProjects.findOne({
                where: { id: caseProjectId },
            });

            if (!mastercaseProject) {
                return res.status(404).json(new ApiError('Case/Project not found', 404));
            }

            const project = await Project.findOne({ where: { projectIdentifier: mastercaseProject.dataValues.projectid } });

            if (!project) {
                return res.status(404).json(new ApiError('Case/Project not found', 404));
            }
            let projectCCMails = project.dataValues.surveyCCMails;
            projectCCMails = projectCCMails ? projectCCMails.split(',') : [];

            //get surveyId from survey using projectId
            const masterSurvey = await MasterSurvey.findOne({
                where: { projectid: mastercaseProject.dataValues.projectid },
            });

            if (masterSurvey) {
                continue;
            }

            //make an entry in survey control
            const surveyControlData = {
                id: uuidv4(),
                activedays: process.env.SURVEY_ACTIVE_DAYS,
                duedateoffset: process.env.SURVEY_DUE_DATE_OFFSET,
                surveycontrolstatusid: surveyControlSystemStatus.dataValues.id,
                companyid: masterCase.dataValues.companyid,
                createdby: userId,
                createdtime: new Date()
            };

            const newMasterSurveyControl =
                await MasterSurveyControl.create(surveyControlData);

            //get survey status whose object = master_survey and status = 'Sent'
            const surveyStatus = await SystemStatus.findOne({
                where: {
                    object: 'master_survey',
                    status: 'SENT'
                },
                attributes: ['id'] // Only select the id column
            });

            //make entry in survey
            const surveyData = {
                id: uuidv4(),
                surveyname: "Survey to receive answers.",
                description: "Sample",
                sentdate: new Date().toISOString().slice(0, 19).replace('T', ' '),
                surveystatusid: surveyStatus.dataValues.id,
                surveycontrolid: newMasterSurveyControl.id,
                surveyquestionstemplateid: systemSurveyTemplate.dataValues.id,
                companyid: mastercaseProject.dataValues.companyid,
                projectid: mastercaseProject.dataValues.projectid,
                spocname: mastercaseProject.dataValues.spocname,
                spocemail: mastercaseProject.dataValues.spocemail,
                createdby: userId,
                createdtime: new Date()
            };

            const newMasterSurvey = await MasterSurvey.create(surveyData);

            //make the url
            //encrypt surveyid
            const encryption = crypto.encryptText(
                newMasterSurvey.id,
                process.env.SURVEY_CIPHER_KEY
            );
            const url = `${process.env.SURVEY_LINK}?verifycode=${encryption}`;

            //make entry for survey assignment
            const surveyAssignmentData = {
                id: uuidv4(),
                sequence: 1,
                otp: null,
                url: url,
                surveyid: newMasterSurvey.id,
                platformuserid: userId,
                caseprojectid: caseProjectId,
                companyid: masterCase.dataValues.companyid,
                createdby: userId,
                createdtime: new Date()
            };

            const newMasterSurveyAssignment = await MasterSurveyAssignment.create(surveyAssignmentData);

            const receiverEmail = mastercaseProject.dataValues.spocemail;
            const spocName = mastercaseProject.dataValues.spocname;
            const sentDate = newMasterSurvey.sentdate;
            const projectName = project.dataValues.projectName;
            const projectId = project.dataValues.projectCode;
            const fiscalYear = company.dataValues.fiscalYear;

            //prepare mail body
            //get mail body

            const masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(company.dataValues.companyId, "SURVEY", "SEND");

            let mailHtml = masterCompanyMailConfiguration.dataValues.body.toString();
            mailHtml = mailHtml.replace("${spocName}", spocName);
            mailHtml = mailHtml.replace("${fiscalYear}", fiscalYear);
            mailHtml = mailHtml.replace("${projectName}", projectName);
            mailHtml = mailHtml.replace("${projectId}", projectId);
            mailHtml = mailHtml.replace("${url}", url);
            mailHtml = mailHtml.replace("${accountName}", company.dataValues.companyName);

            const csvFilePath = await createExcelFile(newMasterSurvey.id);

            //subject
            const paddedNumber = newMasterSurvey.dataValues.surveyid.toString().padStart(6, '0');
            let subject = masterCompanyMailConfiguration.dataValues.subject.toString();
            // subject = subject.replace("${paddedNumber}", paddedNumber);
            subject = subject.replace("${projectName}", projectName);
            subject = subject.replace("${projectId}", projectId);
            subject = subject.replace("${accountName}", company.dataValues.companyName);
            subject = subject.replace("${fiscalYear}", project.dataValues.accountingYear);

            //send mail
            const ccMails = [...companyCCMails, ...projectCCMails];
            const responseSendMail = await sendFile(
                receiverEmail,
                mailHtml,
                subject,
                csvFilePath,
                ccMails
            );

            try {
                await fs.unlink(csvFilePath);
            } catch (err) {
                console.warn('Failed to delete temporary file:', err.message);
            }

        }

        return res.status(200).json({
            success: true,
            message: "Survey link sent successfully.",
            data: null,
        });
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getSurveyById = async (req, res) => {
    try {
        let surveyId = req.params.surveyId;

        const { projectId } = req.query;
        if (projectId) {
            const survey = await MasterSurvey.findOne({ where: { projectid: projectId } });

            if (!survey) {
                return res.status(200).json(new ApiResponse(null, "Survey Not Sent", true));
            }

            surveyId = survey.dataValues.id;
        }

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
        const data = {
            surveyDetails: surveys,
            questionAnswer: questionAnswer
        };

        return res
            .status(200)
            .json(
                new ApiResponse(data, "survey details fetched successfully ", true)
            );
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getSurveyStatus = async (req, res) => {
    try {
        const data = await SystemStatus.findAll({
            where: {
                object: 'master_survey',
                status: {
                    [Op.in]: ["REMINDER SENT", "REVOKED", "GRANTED"]
                }
            },
            attributes: [
                ['id', 'surveyStatusId'],
                [literal(`CASE WHEN status = 'REMINDER SENT' THEN 'Send Reminder' 
                                WHEN status = 'REVOKED' THEN 'Revoke' 
                                WHEN status = 'GRANTED' THEN 'Grant' 
                                ELSE status 
                           END`), 'surveyStatus']
            ]
        });

        return res.status(200).json(new ApiResponse(data, "Survey status types fetch successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const controlSurvey = async (req, res) => {
    try {
        const surveyId = req.params.surveyId;
        const { surveyStatusId } = req.body;

        const surveyDetails = await surveyQueries.getSurveyDetails(surveyId);

        //get survey
        const survey = await MasterSurvey.findOne({
            where: {
                id: surveyId
            }
        });

        //get cc mails
        let company = await Company.findOne({
            where: {
                companyId: survey.dataValues.companyid
            }
        })
        let companyCCMails = company.dataValues.ccmails;
        companyCCMails = companyCCMails ? companyCCMails.split(',') : [];

        const requestSurveyStatus = await SystemStatus.findOne({
            where: {
                id: surveyStatusId
            }
        });


        //check survey validity
        if (surveyDetails.surveyStatus == 'EXPIRED') {
            return res.status(200).json(new ApiResponse(null, "Survey Expired.", false));
        }

        //you can revoke or sent reminder only if survey control status is open
        if (surveyDetails.surveyControlStatus == 'OPEN') {
            //for sent reminder
            if (requestSurveyStatus.dataValues.status == 'REMINDER SENT') {
                //get survey details
                // const survey = await caseQueries.getSurveyById(surveyId);
                const receiverName = surveyDetails.name; // spoc name
                const sendDate = surveyDetails.sentDate;
                const url = surveyDetails.url;
                const projectName = surveyDetails.projectName;
                const projectId = surveyDetails.projectId;

                //project cc mails
                const project = await Project.findOne({ where: { projectCode: projectId, companyId: surveyDetails.companyId } });
                let projectCCMails = project.dataValues.surveyCCMails;
                projectCCMails = projectCCMails ? projectCCMails.split(',') : [];

                //prepare mail body
                const masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(company.dataValues.companyId, "SURVEY", "REMINDER");

                let body = masterCompanyMailConfiguration.dataValues.body.toString();
                body = body.replace("${receiverName}", receiverName);
                // body = body.replace("${sendDate}", sendDate);
                body = body.replace("${projectId}", projectId);
                body = body.replace("${projectName}", projectName);
                body = body.replace("${url}", url);
                body = body.replace("${accountName}", company.dataValues.companyName);
                body = body.replace("${fiscalYear}", company.dataValues.fiscalYear);
                // body = body.replace("${sendDate}", sendDate);

                //subject
                const paddedNumber = surveyDetails.surveyid.toString().padStart(6, '0');
                let subject = masterCompanyMailConfiguration.dataValues.subject.toString();
                // subject = subject.replace("${paddedNumber}", paddedNumber);
                subject = subject.replace("${projectName}", projectName);
                subject = subject.replace("${projectId}", projectId);
                subject = subject.replace("${accountName}", company.dataValues.companyName);

                const csvFilePath = await createExcelFile(surveyId);

                const email = surveyDetails.userEmail;

                //send mail
                const ccMails = [...companyCCMails, ...projectCCMails];
                const responseSendMail = await sendFile(
                    email,
                    body,
                    subject,
                    csvFilePath,
                    ccMails
                );

                await fs.unlink(csvFilePath);

                // await sendMail(email, body, subject, ccMails);

                //revoke the master survey
                const surveyStatus = await SystemStatus.findOne({
                    where: {
                        object: 'master_survey',
                        status: 'REMINDER SENT'
                    }
                });
                await MasterSurvey.update(
                    {
                        surveystatusid: surveyStatus.id,
                        modifiedtime: new Date()
                    },
                    { where: { id: surveyId } }
                );
            }
            else if (requestSurveyStatus.dataValues.status == 'REVOKED') {
                //close the master survey control
                const surveyControlStatus = await SystemStatus.findOne({
                    where: {
                        object: 'master_survey_control',
                        status: 'CLOSED'
                    }
                });
                await MasterSurveyControl.update(
                    { surveycontrolstatusid: surveyControlStatus.id },
                    { where: { id: surveyDetails.surveyControlId } }
                );

                //revoke the master survey
                const surveyStatus = await SystemStatus.findOne({
                    where: {
                        object: 'master_survey',
                        status: 'REVOKED'
                    }
                });
                await MasterSurvey.update(
                    { surveystatusid: surveyStatus.id },
                    { where: { id: surveyId } }
                );
            }
        }//you can grant a survey is the master control is closed
        else if (surveyDetails.surveyControlStatus == 'CLOSED') {
            //grant a survey, it must be status revoked
            if (requestSurveyStatus.dataValues.status == 'GRANTED' && surveyDetails.surveyStatus != 'GRANTED') {
                //survey control status to Open
                const surveyControlStatus = await SystemStatus.findOne({
                    where: {
                        object: 'master_survey_control',
                        status: 'OPEN'
                    }
                });
                await MasterSurveyControl.update(
                    { surveycontrolstatusid: surveyControlStatus.id },
                    { where: { id: surveyDetails.surveyControlId } }
                );
                //survey status to granted
                const surveyStatus = await SystemStatus.findOne({
                    where: {
                        object: 'master_survey',
                        status: 'GRANTED'
                    }
                });
                await MasterSurvey.update(
                    { surveystatusid: surveyStatus.id },
                    { where: { id: surveyId } }
                );
            }
        }

        return res.status(200).json(new ApiResponse(null, "Survey updated.", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};


const sendReminder = async (req, res) => {
    try {

        const surveyIds = req.body.surveyIds;

        //check request
        if (!surveyIds || surveyIds.length == 0) {
            return res
                .status(400)
                .json(new ApiResponse(null, "Survey ids missing."), false);
        }

        for (const surveyId of surveyIds) {

            const surveyDetails = await surveyQueries.getSurveyDetails(surveyId);

            //get cc mails
            let company = await Company.findOne({
                where: {
                    companyId: surveyDetails.companyId
                }
            })
            let companyCCMails = company.dataValues.ccmails;
            companyCCMails = companyCCMails ? companyCCMails.split(',') : [];

            //project cc mails
            const project = await Project.findOne({ where: { projectCode: surveyDetails.projectId, companyId: surveyDetails.companyId } });
            let projectCCMails = project.dataValues.surveyCCMails;
            projectCCMails = projectCCMails ? projectCCMails.split(',') : [];

            //prepare mail body
            const masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(company.dataValues.companyId, "SURVEY", "REMINDER");

            let body = masterCompanyMailConfiguration.dataValues.body.toString();
            body = body.replace("${receiverName}", surveyDetails.name);
            // body = body.replace("${sendDate}", sendDate);
            body = body.replace("${projectId}", surveyDetails.projectId);
            body = body.replace("${projectName}", surveyDetails.projectName);
            body = body.replace("${url}", surveyDetails.url);
            body = body.replace("${accountName}", company.dataValues.companyName);
            body = body.replace("${fiscalYear}", company.dataValues.fiscalYear);
            // body = body.replace("${sendDate}", sendDate);

            //subject
            const paddedNumber = surveyDetails.surveyid.toString().padStart(6, '0');
            let subject = masterCompanyMailConfiguration.dataValues.subject.toString();
            // subject = subject.replace("${paddedNumber}", paddedNumber);
            subject = subject.replace("${projectName}", surveyDetails.projectName);
            subject = subject.replace("${projectId}", surveyDetails.projectId);
            subject = subject.replace("${accountName}", company.dataValues.companyName);

            const email = surveyDetails.userEmail;

            // await sendMail(email, body, subject, ccMails);
            const csvFilePath = await createExcelFile(surveyId);

            // const csvFilePath = await createCSVforSurvey(surveyId);

            //send mail
            const ccMails = [...companyCCMails, ...projectCCMails];
            const responseSendMail = await sendFile(
                email,
                body,
                subject,
                csvFilePath,
                ccMails
            );

            await fs.unlink(csvFilePath);

            //revoke the master survey
            const surveyStatus = await SystemStatus.findOne({
                where: {
                    object: 'master_survey',
                    status: 'REMINDER SENT'
                }
            });
            await MasterSurvey.update(
                {
                    surveystatusid: surveyStatus.id,
                    modifiedtime: new Date()
                },
                { where: { id: surveyId } }
            );
        }

        return res.status(200).json(new ApiResponse(null, "Reminders sent successfully.", true));


    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};


const flagProject = async (req, res) => {
    try {

        const { caseProjectIds, message } = req.body;

        for (const caseProjectId of caseProjectIds) {

            await MasterCaseProjects.update(
                {
                    flag: true,
                    message: message
                },
                { where: { id: caseProjectId } }
            );
        }

        return res.status(200).json(new ApiResponse(null, "Projects flagged successfully", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};


const uploadSurveys = async (req, res) => {
    try {

        const caseId = req.query.caseId;
        const userId = req.params.userId;

        //validate request
        if (!caseId) {
            return res.status(400).json(new ApiResponse(null, "Case Id missing", false));
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json(new ApiResponse(null, "No files found", false));
        }

        surveySheetsProcessor(req.files, userId, caseId);

        return res.status(200).json(new ApiResponse(null, "Survey sheets uploaded successfully", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const downloadSurvey = async (req, res) => {
    try {
        const { format } = req.query;
        let surveyIds = req.query.surveyIds ? JSON.parse(req.query.surveyIds.replace(/'/g, '"')) : null;

        //validate the request
        if (format && (format != 'pdf' && format != 'docx')) {
            return res.status(400).json(new ApiResponse(null, "Invalid File Type", false));
        }

        let surveyDetails = [];
        for (let surveyId of surveyIds) {
            const surveyDetail = await caseQueries.getSurveyById(surveyId);
            const questionAndAnswers = await surveyQueries.getSurveyQuestionAndAnswers(surveyId);
            surveyDetails.push({ surveyDetail, questionAndAnswers });
        }

        // Convert survey details to document
        const filePath = await objectToDocument(surveyDetails, format);

        res.download(filePath, `survey.${format}`, (err) => {
            if (err) {
                console.error("Error sending the file:", err);
                return res.status(500).json({ message: "Error sending the file", error: err });
            }
            // Optionally delete the file after sending to save space
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error("Error deleting the file:", unlinkErr);
                }
            });
        });
    } catch (error) {
        console.log("Error", error.stack);
        return res.status(500).json({ message: "Error generating report", error: error.stack });
    }
};

module.exports = {
    getCaseTypes,
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
};
