const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const surveyQueries = require("../queries/survey.queries");
const crypto = require("../utils/crypto");
const { generateOtp } = require("../utils/otp");
const MasterSurveyAssignment = require("../models/master-survey-assignment.model");
const { sendSurveyInformation } = require("../utils/mailGraphApi");
const { sendMail } = require("../utils/mailGraphApi");
const { v4: uuidv4 } = require("uuid");
const MasterSurveyAnswer = require("../models/master-survey-answer.model");
const MasterSurvey = require("../models/master-survey.model");
const MasterSurveyControl = require("../models/master-survey-control.model");
const SystemStatus = require("../models/system-status.model");
const { axiosRequest } = require("../utils/axios");
const MasterCompanyMailConfiguration = require("../models/master-company-mail-configuration.model");
const companyQueries = require("../queries/company.queries");
const sequelize = require("../setups/db");

//remove after
const SystemSurveyTemplate = require("../models/system-survey-template.model");
const SystemSurveyQuestion = require("../models/system-survey-question.model");
const Company = require("../models/company.model");


const authenticateLinkAndSendOtp = async (req, res) => {
    try {
        const { encryption } = req.params;

        const surveyId = crypto.decryptText(
            encryption,
            process.env.SURVEY_CIPHER_KEY
        );
        const surveyDetails = await surveyQueries.getSurveyDetails(surveyId);

        //check survey status
        if (surveyDetails.surveyControlStatus != 'OPEN') {
            //get why survey is not open from survey table
            let responseMessage = "";
            if (surveyDetails.surveyStatus == "RESPONSE RECEIVED") responseMessage = "Response received. Survey no longer active."
            if (surveyDetails.surveyStatus == "REVOKED") responseMessage = "Survey has been revoked."
            if (surveyDetails.surveyStatus == "EXPIRED") responseMessage = "Survey has been expired."
            return res
                .status(404)
                .json(new ApiResponse(null, responseMessage, false));
        }

        //otp
        const { genarateotp } = req.query;
        if (genarateotp) {
            //generate otp and save
            const otp = await generateOtp(
                process.env.OTP_LENGTH,
                process.env.OTP_ALPHANUMERIC
            );
            const result = await MasterSurveyAssignment.update(
                { otp: otp },
                { where: { surveyid: surveyId } }
            );

            //mail
            let masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(surveyDetails.companyId, "SURVEY", "OTP");
            let subject = masterCompanyMailConfiguration.dataValues.subject;
            let body = masterCompanyMailConfiguration.dataValues.body;

            const projectName = surveyDetails.projectName;
            const projectCode = surveyDetails.projectId;
            const accountName = surveyDetails.clientName;
            const spocName = surveyDetails.name;

            subject = subject.replaceAll('${projectName}', projectName);
            subject = subject.replaceAll('${projectCode}', projectCode);
            subject = subject.replaceAll('${accountName}', accountName);

            body = body.replaceAll('${spocName}', spocName);
            body = body.replaceAll('${otp}', otp);

            const ccMails = [];
            await sendMail(surveyDetails.userEmail, body, subject, ccMails);

            //generate cipher using master assignment table id
            const assignment = await MasterSurveyAssignment.findOne({
                where: {
                    surveyid: surveyId,
                },
            });
            //encrypt the id
            const cipher = crypto.encrypt(
                assignment.dataValues.id,
                process.env.SURVEY_CIPHER_KEY
            );

            //generate response data
            const data = {
                ...surveyDetails,
                userEmail: surveyDetails.userEmail.replace(
                    /^(.{2}).*?(@.*)$/,
                    "$1****$2"
                ),
                cipher: cipher,
                supportEmail: process.env.SURVEY_SUPPORT_MAIL,
                company: process.env.SURVEY_COMPANY,
            };

            return res
                .status(200)
                .json(new ApiResponse(data, "OTP sent", true));
        }

        //generate response data
        const data = {
            ...surveyDetails,
            userEmail: surveyDetails.userEmail.replace(
                /^(.{2}).*?(@.*)$/,
                "$1****$2"
            ),
            supportEmail: process.env.SURVEY_SUPPORT_MAIL,
            company: process.env.SURVEY_COMPANY,
        };

        return res
            .status(200)
            .json(new ApiResponse(data, "Url verified", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const verifyOtpAndGetSurveyData = async (req, res) => {
    try {

        const { cipher, otp } = req.body;

        const { encryption } = req.params;
        const surveyId = crypto.decryptText(
            encryption,
            process.env.SURVEY_CIPHER_KEY
        );
        const surveyDetails = await surveyQueries.getSurveyDetails(surveyId);

        //check survey status
        if (surveyDetails.surveyControlStatus !== "OPEN") {
            //get why survey is not open from survey table
            let responseMessage = "";
            if (surveyDetails.surveyStatus == "RESPONSE RECEIVED") responseMessage = "Response received. Survey no longer active."
            if (surveyDetails.surveyStatus == "REVOKED") responseMessage = "Survey has been revoked."
            if (surveyDetails.surveyStatus == "EXPIRED") responseMessage = "Survey has been expired."
            return res
                .status(404)
                .json(new ApiResponse(null, responseMessage, false));
        }

        //validate request body
        if (!cipher || !otp) {
            return res
                .status(400)
                .json(new ApiResponse(null, "Invalid request.", false));
        }

        //validate request
        //decrypt cipher and get survey assignment id
        const surveyAssignmentId = crypto.decryptText(
            cipher,
            process.env.SURVEY_CIPHER_KEY
        );

        const assignment = await MasterSurveyAssignment.findOne({
            where: {
                id: surveyAssignmentId,
            },
            attributes: ["id", "otp"], // Select both id and otp columns
        });
        if (!assignment) {
            return res
                .status(400)
                .json(new ApiResponse(null, "Invalid request.", false));
        }

        //verify otp
        if (assignment.dataValues.otp !== otp) {
            return res.status(400).json(new ApiResponse(null, "Invalid Otp.", false));
        }

        //get questions and answers
        //get questions
        const questionsAndAnswers =
            await surveyQueries.getSurveyQuestionAndAnswers(surveyId);
        const data = {
            cipher: cipher,
            questionsAndANswers: questionsAndAnswers,
            lastSaved: questionsAndAnswers[0].lastSaved
        };
        return res.status(200).json(new ApiResponse(data, "Otp verified.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const saveAnswer = async (req, res) => {
    try {

        const lastSaved = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const { submit, cipher } = req.body;

        const { encryption } = req.params;
        const surveyId = crypto.decryptText(
            encryption,
            process.env.SURVEY_CIPHER_KEY
        );
        const surveyDetails = await surveyQueries.getSurveyDetails(surveyId);

        //check survey status
        if (surveyDetails.surveyControlStatus !== "OPEN") {
            //get why survey is not open from survey table
            let responseMessage = "";
            if (surveyDetails.surveyStatus == "RESPONSE RECEIVED") responseMessage = "Response received. Survey no longer active."
            if (surveyDetails.surveyStatus == "REVOKED") responseMessage = "Survey has been revoked."
            if (surveyDetails.surveyStatus == "EXPIRED") responseMessage = "Survey has been expired."
            return res
                .status(404)
                .json(new ApiResponse(null, responseMessage, false));
        }

        //get company id from master survey
        const survey = await MasterSurvey.findOne({
            where: { id: surveyId },
            attributes: ["companyid"], // Select only the companyid column
        });

        //decrypt cipher and get survey assignment id
        const surveyAssignmentId = crypto.decryptText(
            cipher,
            process.env.SURVEY_CIPHER_KEY
        );

        //get answer and question id
        const answersList = req.body.answers;

        for (const answerData of answersList) {
            const questionId = answerData.questionId;
            const answer = answerData.answer;

            const answerRecord = await MasterSurveyAnswer.findOne({
                where: {
                    surveyassignmentid: surveyAssignmentId,
                    surveyquestionsid: questionId,
                },
            });

            //new entry
            if (!answerRecord) {
                const newAnswerData = {
                    id: uuidv4(),
                    answer: answer,
                    surveyassignmentid: surveyAssignmentId,
                    surveyquestionsid: questionId,
                    surveyid: surveyId,
                    companyid: survey.dataValues.companyid,
                    saveddate: new Date().toISOString().slice(0, 19).replace('T', ' '),

                    createdby: "external",
                    createdtime: new Date(),
                    modifiedby: "external",
                    modifiedtime: new Date(),
                    sysmodtime: new Date(),
                };

                //save answer
                await MasterSurveyAnswer.create(newAnswerData);
            } else {
                //update answer
                answerRecord.answer = answer;
                answerRecord.saveddate = lastSaved;
                answerRecord.modifiedtime = new Date();

                await answerRecord.save();
            }
        }

        if (submit) {
            //get survey status and survey control status
            const masterSurvey = await MasterSurvey.findOne({
                where: { id: surveyId },
            });

            const surveyControlId = masterSurvey.dataValues.surveycontrolid;

            //change survey status and survey control status
            const surveyControl = await MasterSurveyControl.findOne({
                where: { id: surveyControlId },
            });


            //get survey status where survey response received
            let statusRecord = await SystemStatus.findOne({
                where: {
                    object: "master_survey_control",
                    status: "CLOSED",
                },
                attributes: ["id"], // Select only the id column
            });

            surveyControl.surveycontrolstatusid = statusRecord.dataValues.id;

            //update it
            await surveyControl.save();

            //update master_survey status to response received
            //get survey
            const survey = await MasterSurvey.findOne({
                where: {
                    id: surveyId
                }
            });
            //get system status for response received
            statusRecord = await SystemStatus.findOne({
                where: {
                    object: "master_survey",
                    status: "RESPONSE RECEIVED",
                },
                attributes: ["id"], // Select only the id column
            });
            survey.surveystatusid = statusRecord.dataValues.id;
            survey.closedate = lastSaved;

            await survey.save();


            //send mail to the responder
            //send response received mail
            let email = surveyDetails.userEmail;
            const projectId = surveyDetails.projectId;
            const projectName = surveyDetails.projectName;
            const name = surveyDetails.name;
            const date = lastSaved;
            const support = process.env.SURVEY_SUPPORT_MAIL;

            //get mail body
            let masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(surveyDetails.companyId, "SURVEY", "RESPONSE RECEIVED - USER");


            let body = masterCompanyMailConfiguration.dataValues.body;
            body = body.replaceAll("${name}", name);
            body = body.replace("${projectId}", projectId);
            body = body.replace("${projectName}", projectName);
            body = body.replace("${date}", date);
            body = body.replace("${support}", support);

            let subject = masterCompanyMailConfiguration.dataValues.subject;
            subject = subject.replace("${accountName}", surveyDetails.clientName);
            subject = subject.replace("${projectId}", projectId);
            subject = subject.replace("${projectName}", projectName);

            const ccMails = [];
            await sendMail(email, body, subject, ccMails);



            //send mail to the internal team
            email = process.env.SURVEY_CONFIRM_MAIL;
            //get mail body
            masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(surveyDetails.companyId, "SURVEY", "RESPONSE RECEIVED - SUPPORT TEAM");

            body = masterCompanyMailConfiguration.dataValues.body;
            body = body.replace("${name}", name);
            body = body.replace("${projectId}", projectId);
            body = body.replace("${projectName}", projectName);
            body = body.replace("${date}", date);

            subject = masterCompanyMailConfiguration.dataValues.subject;
            subject = subject.replace("${accountName}", surveyDetails.clientName);
            subject = subject.replace("${projectId}", projectId);
            subject = subject.replace("${projectName}", projectName);

            await sendMail(email, body, subject, ccMails);

            //trigger ai
            //update aistatus to unprocessed
            await MasterSurvey.update(
                { aistatus: 'unprocessed' },
                { where: { id: surveyId } }
            );

            //call technical summary generate
            const triggerSummary = axiosRequest(
                "post",
                process.env.AI_GENERATE_SUMMARY,
                {
                    companyId: masterSurvey.dataValues.companyid,
                    projectId: masterSurvey.dataValues.projectid
                }
            );
            console.log(`Survey | action:Trigger AI Summary | projectId=${masterSurvey.dataValues.projectid} | surveyId=${masterSurvey.dataValues.surveyid}`);
        }

        const data = {
            lastSaved: lastSaved
        }
        return res
            .status(200)
            .json(new ApiResponse(data, "Answer saved Successfully", true));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const updateSurveyQuestions = async (req, res) => {
    try {
        const companies = await Company.findAll({ attributes: ['companyId'] });
        const companyIds = companies.map(company => company.dataValues.companyId);

        //default template questions
        let defaultQuestions = await SystemSurveyQuestion.findAll({
            order: [['sequence', 'ASC']], // Order by the 'sequence' column in ascending order
        });
        for (let i = 0; i < defaultQuestions.length; i++) {
            defaultQuestions[i] = defaultQuestions[i].dataValues;
        }

        for (const companyId of companyIds) {

            const result = await SystemSurveyTemplate.findOne({
                where: {
                    companyid: companyId,
                    tier: 1
                }
            });
            if (result) {
                continue;
            }

            //create a template for company
            const templateData = {
                id: uuidv4(),
                tier: 1,
                description: '5 Questions',
                createdby: 'system',
                modifiedby: 'system',
                createdtime: '2024-01-01 00:00:00',
                modifiedtime: '2024-01-01 00:00:00',
                sysmodtime: '2024-01-01 00:00:00',
                companyid: companyId
            }
            await SystemSurveyTemplate.create(templateData);

            //update master_survey with template for that company
            await MasterSurvey.update(
                { surveyquestionstemplateid: templateData.id },
                {
                    where: {
                        companyid: companyId,
                    },
                }
            );

            //insert questions into system_survey_question
            let questionsData = [];
            for (const defaultQuestion of defaultQuestions) {
                const questionData = {
                    id: uuidv4(),
                    question: defaultQuestion.question,
                    sequence: defaultQuestion.sequence,
                    description: defaultQuestion.description,
                    surveytemplateid: templateData.id,
                    createdby: 'system',
                    modifiedby: 'system',
                    createdtime: '2024-01-01 00:00:00',
                    modifiedtime: '2024-01-01 00:00:00',
                    sysmodtime: '2024-01-01 00:00:00'
                }
                questionsData.push(questionData);

                await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

                await MasterSurveyAnswer.update(
                    { surveyquestionsid: questionData.id },
                    {
                        where: {
                            surveyquestionsid: defaultQuestion.id,
                            companyid: companyId,
                        },
                    }
                );

                await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            }
            await SystemSurveyQuestion.bulkCreate(questionsData);
        }
        console.log("DONE");
        return res.status(200).json(new ApiResponse(null, "DONE", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

module.exports = {
    authenticateLinkAndSendOtp,
    verifyOtpAndGetSurveyData,
    saveAnswer,
    updateSurveyQuestions
};
