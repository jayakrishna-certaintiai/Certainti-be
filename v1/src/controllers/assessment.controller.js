const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { v4: uuidv4 } = require("uuid");
const Project = require("../models/project.model");
const assessmentQueries = require("../queries/assessment.queries");
const { sendMail, sendFile } = require("../utils/mailGraphApi");
const MasterInteractions = require("../models/master-interactions.model");
const MasterInteractionsQA = require("../models/master-interactions-qa.model");
const SystemStatus = require("../models/system-status.model");
const crypto = require("../utils/crypto");
const { generateOtp } = require("../utils/otp");
const Company = require("../models/company.model");
const MasterCase = require("../models/master-case.model");
const { axiosRequest } = require("../utils/axios");
const { createCSVforInteraction } = require("../utils/csv");
const fs = require('fs').promises;
const companyQueries = require("../queries/company.queries");
const { surveySheetsProcessor, intearctionSheetsProcessor } = require("../utils/fileToDatabase");


const createInteractions = async (req, res) => {
    try {

        const projectIdentifier = req.body.projectid;
        const assessmentId = req.body.assessment_id;
        if (!projectIdentifier) {
            return res.status(400).json(new ApiResponse(null, "projectid Missing", false));
        }

        //find for whose did not send interactions
        //join interactions and master_project_ai_assessment on assessmentid
        const assessmentIds = await assessmentQueries.getUncreatedInteractionOfProject(projectIdentifier, assessmentId);

        for (const assessmentId of assessmentIds) {

            //get project details
            const project = await Project.findOne({ where: { projectId: assessmentId.projectId } });

            //get company
            const company = await Company.findOne({
                where: {
                    companyId: project.dataValues.companyId
                }
            });

            //get System Status for master_interactions and status = OPEN
            const interactionsStatus = await SystemStatus.findOne({
                where: {
                    object: 'master_interactions',
                    status: 'NOT SENT'
                }
            });

            //create interactions object
            const interactionsData = {
                id: uuidv4(),
                spocname: project.dataValues.spocName,
                spocemail: project.dataValues.spocEmail,
                assessmentid: assessmentId.assessmentId,
                projectidentifier: assessmentId.projectId,
                companyid: assessmentId.companyId,
                statusid: interactionsStatus.dataValues.id,
                createdy: 'system',
                createdtime: new Date()
            }
            const masterInteraction = await MasterInteractions.create(interactionsData);

            //create interactions-qa object
            //get questions for that assessmentId
            const questions = await assessmentQueries.getInteractionDetails(assessmentId.assessmentId);

            for (const question of questions) {

                //create interactions-qa object
                const interactionsQAData = {
                    id: uuidv4(),
                    question: question.intent,
                    intentframeworkid: question.intentFrameworkId,
                    aiinteractionid: question.aiInteractionId,
                    assessmentid: assessmentId.assessmentId,
                    projectidentifier: assessmentId.projectId,
                    companyid: assessmentId.companyId,
                    interactionsid: masterInteraction.id,
                    createdby: 'system',
                    createdtime: new Date()
                }
                await MasterInteractionsQA.create(interactionsQAData);
            }

            //make the url
            //encrypt interactionid
            const encryption = crypto.encryptText(
                masterInteraction.id,
                process.env.INTERACTIONS_CIPHER_KEY
            );
            const url = `${process.env.INTERACTIONS_LINK}?verifycode=${encryption}`;

            //update interaction url
            await MasterInteractions.update(
                { url: url },
                { where: { id: masterInteraction.id } }
            );

            console.log(`Interaction | action:Created Interaction | projectIdentifier=${assessmentId.projectId} | interactionid=${masterInteraction.interactionsid} | url=${url}`);


            //auto interaction
            if (company.dataValues.autoSendInteractions == true) {
                const interactionIds = [masterInteraction.id];
                let interaction = await assessmentQueries.getUnsentInteractionsByUser(interactionIds);
                interaction = interaction[0];

                //get company details


                if (!interaction.spocEmail) {
                    const body = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Survey Invitation</title>
                        </head>
                        <body>
                            <p>Dear ResDev Team,</p>
                            <p>Greetings For The Day!</p>
                            <p></p>This is regarding the project ${interaction.projectName} (Project ID: ${interaction.projectCode}) related to R&D Credits Claims Process for fiscal year ${interaction.accountingYear}. </br></br>
                            <p>The spoc details for the project are missing.</p>
                            <p>Please notify Company: ${company.dataValues.companyName} to update the spoc details.</p>
                        </body>
                        </html>
                    `;
                    const paddedNumber = interaction.interactionsid.toString().padStart(6, '0');
                    const subject = `IN-${paddedNumber} Interaction for ${interaction.projectCode}-${interaction.projectName} SPOC email missing`;
                    const supportEmail = process.env.SURVEY_SUPPORT_MAIL;

                    const ccMails = [];
                    await sendMail(supportEmail, body, subject, ccMails);


                    return res.status(400).json(new ApiResponse(null, "Spoc Mail Missing", false));
                }

                //body
                const mailHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Survey Invitation</title>
                </head>
                <body>
                    <p>Dear ${interaction.spocName},</p>
                    <p>Greetings For The Day!</p>
                    <p></p>This is regarding the project ${interaction.projectName} (Project ID: ${interaction.projectCode}) related to R&D Credits Claims Process for fiscal year ${interaction.accountingYear}. </br></br>
                    <p>Please take a moment to answer the questions related to the project by. </p>
                    <p>1.Using the link--> <b><a href="${interaction.url}">Interaction Link</a></b></p>
                    </br></br>
                    <b>OR</b></br></br>
                    <p>2. Fill the answers in the attached excel template and simply reply back to this email.</p>
                    <p>Your responses are invaluable to us and will contribute significantly to our efforts. Upon completion, click on submit, and your responses will be securely forwarded to us for further processing.</p>
                    <p>Thank you for your cooperation and support.</p>
                    <p>ResDev Tax Consultants </br>Powered By Certainti.ai</p>
                </body>
                </html>`;

                const csvFilePath = await createCSVforInteraction(interaction.id);

                //subject
                const paddedNumber = interaction.interactionsid.toString().padStart(6, '0');
                const subject = `IN-${paddedNumber} Interaction for ${interaction.projectCode}-${interaction.projectName}`;

                //send mail
                const ccMails = [];
                const responseSendMail = await sendFile(
                    interaction.spocEmail,
                    mailHtml,
                    subject
                    , csvFilePath,
                    ccMails
                );

                await fs.unlink(csvFilePath);

                //update interaction status
                const interactionsStatus = await SystemStatus.findOne({
                    where: {
                        object: 'master_interactions',
                        status: 'SENT'
                    }
                });
                await MasterInteractions.update(
                    { statusid: interactionsStatus.dataValues.id },
                    { where: { id: interaction.id } }
                );

                console.log(`Interaction | action:Send Interaction By System | projectIdentifier=${interaction.projectidentifier} | interactionId=${interaction.interactionsid} | url=${interaction.url}`);

            }
        }

        return res.status(200).json(new ApiResponse(null, "Interactions Created", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}


const sendInteractions = async (req, res) => {
    try {

        //find interactions whose status is CREATED
        const interactions = assessmentQueries.getUnsentInteractions();

        for (const interaction of interactions) {

            //send mail to user
            //prepare mail body
            const mailHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Survey Invitation</title>
            </head>
            <body>
                <p>Dear ${interaction.spocName},</p>
                <p>Greetings For The Day!</p>
                <p></p>This is regarding the project ${interaction.projectName} (Project ID: ${interaction.projectCode}) related to R&D Credits Claims Process for fiscal year ${interaction.accountingYear}. </br></br>
                <p>Please take a moment to answer the questions related to the project by. </p>
                <p>1.Using the link--> <b><a href="${interaction.url}">Interaction Link</a></b></p>
                </br></br>
                <b>OR</b></br></br>
                <p>2. Fill the answers in the attached excel template and simply reply back to this email.</p>
                <p>Your responses are invaluable to us and will contribute significantly to our efforts. Upon completion, click on submit, and your responses will be securely forwarded to us for further processing.</p>
                <p>Thank you for your cooperation and support.</p>
                <p>ResDev Tax Consultants </br>Powered By Certainti.ai</p>
            </body>
            </html>`;

            //subject
            const paddedNumber = interaction.interactionsid.toString().padStart(6, '0');
            const subject = `IN-${paddedNumber} Interaction for ${interaction.projectCode}-${interaction.projectName}`;

            const csvFilePath = await createCSVforInteraction(interaction.id);

            //send mail
            const responseSendMail = await sendSurveyInformation(
                interaction.spocEmail,
                mailHtml,
                subject
                , csvFilePath
            );

            await fs.unlink(csvFilePath);

            //update interaction status to SENT
            const interactionsStatus = await SystemStatus.findOne({
                where: {
                    object: 'master_interactions',
                    status: 'SENT'
                }
            });
            await MasterInteractions.update(
                { statusid: interactionsStatus.dataValues.id },
                { where: { id: interaction.id } }
            );


            console.log(`Interaction | action:Send Interaction By External | projectIdentifier=${interaction.projectidentifier} | interactionId=${interaction.interactionsid} | url=${interaction.url}`);
        }

        return res
            .status(200)
            .json(new ApiResponse(null, "Interactions sent successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const sendInteractionsByUser = async (req, res) => {
    try {

        const { interactionIds, sendReminder, sendInteraction } = req.body;

        if (!interactionIds) {
            return res.status(400).json(new ApiResponse(null, "Interaction ids not found", false));
        }

        //find interactions whose status is CREATED
        const interactions = await assessmentQueries.getUnsentInteractionsByUser(interactionIds);

        for (const interaction of interactions) {

            //send mail to user
            //prepare mail body
            let subject = "";
            let body = "";

            if (sendReminder && sendReminder == true) {

                let masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(interaction.companyId, 'INTERACTION', 'REMINDER');

                subject = masterCompanyMailConfiguration.dataValues.subject;
                body = masterCompanyMailConfiguration.dataValues.body;

                const projectName = interaction.projectName;
                const projectCode = interaction.projectCode;
                const accountName = interaction.companyName;
                const spocName = interaction.spocName;
                const fiscalYear = interaction.fiscalYear;
                const url = interaction.url;

                subject = subject.replaceAll('${interactionId}', interaction.interactionsid);
                subject = subject.replaceAll('${projectName}', projectName);
                subject = subject.replaceAll('${projectCode}', projectCode);
                subject = subject.replaceAll('${accountName}', accountName);

                body = body.replaceAll('${spocName}', spocName);
                body = body.replaceAll('${projectName}', projectName);
                body = body.replaceAll('${projectCode}', projectCode);
                body = body.replaceAll('${fiscalYear}', fiscalYear);
                body = body.replaceAll('${url}', url);

            } else if (sendInteraction && sendInteraction == true) {
                let masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(interaction.companyId, 'INTERACTION', 'SEND');

                subject = masterCompanyMailConfiguration.dataValues.subject;
                body = masterCompanyMailConfiguration.dataValues.body;

                const projectName = interaction.projectName;
                const projectCode = interaction.projectCode;
                const accountName = interaction.companyName;
                const spocName = interaction.spocName;
                const fiscalYear = interaction.fiscalYear;
                const url = interaction.url;

                subject = subject.replaceAll('${interactionId}', interaction.interactionsid);
                subject = subject.replaceAll('${projectName}', projectName);
                subject = subject.replaceAll('${projectCode}', projectCode);
                subject = subject.replaceAll('${accountName}', accountName);

                body = body.replaceAll('${spocName}', spocName);
                body = body.replaceAll('${projectName}', projectName);
                body = body.replaceAll('${projectCode}', projectCode);
                body = body.replaceAll('${fiscalYear}', fiscalYear);
                body = body.replaceAll('${url}', url);
            }

            const csvFilePath = await createCSVforInteraction(interaction.id);

            //send mail

            const companyCCMails = interaction.interactionccMails ? interaction.interactionccMails.split(',') : [];
            const projectCCMails = interaction.interactionCCMails ? interaction.interactionCCMails.split(',') : [];
            const ccMails = [...companyCCMails, ...projectCCMails];

            const responseSendMail = await sendFile(
                interaction.spocEmail,
                body,
                subject,
                csvFilePath,
                ccMails
            );

            await fs.unlink(csvFilePath);

            //update interaction status to SENT or REMINDER SENT
            if (sendInteraction && sendInteraction == true) {
                const interactionsStatus = await SystemStatus.findOne({
                    where: {
                        object: 'master_interactions',
                        status: 'SENT'
                    }
                });
                await MasterInteractions.update(
                    { statusid: interactionsStatus.dataValues.id },
                    { where: { id: interaction.id } }
                );
            } else if (sendReminder && sendReminder == true) {
                const interactionsStatus = await SystemStatus.findOne({
                    where: {
                        object: 'master_interactions',
                        status: 'REMINDER SENT'
                    }
                });
                await MasterInteractions.update(
                    { statusid: interactionsStatus.dataValues.id },
                    { where: { id: interaction.id } }
                );
            }


            if (sendReminder) {
                console.log(`Interaction | action:Send Reminder Interaction By User | projectIdentifier=${interaction.projectidentifier} | interactionId=${interaction.interactionsid} | url=${interaction.url}`);
            }
            else {
                console.log(`Interaction | action:Send Interaction By User | projectIdentifier=${interaction.projectidentifier} | interactionId=${interaction.interactionsid} | url=${interaction.url}`);
            }
        }

        return res
            .status(200)
            .json(new ApiResponse(null, "Interactions sent successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}



const authenticateLinkAndSendOtp = async (req, res) => {
    try {
        const { encryption } = req.params;

        const interactionId = crypto.decryptText(
            encryption,
            process.env.INTERACTIONS_CIPHER_KEY
        );
        //get interaction object
        const interaction = await MasterInteractions.findOne({
            where: {
                id: interactionId
            }
        });

        //get project
        const project = await Project.findOne({
            where: {
                projectId: interaction.dataValues.projectidentifier
            }
        });

        //get company
        const company = await Company.findOne({
            where: {
                companyId: project.dataValues.companyId
            }
        });

        //get status
        const status = await SystemStatus.findOne({
            where: {
                id: interaction.dataValues.statusid
            }
        });

        //check survey status
        if (status.dataValues.status != 'REMINDER SENT' && status.dataValues.status != 'SENT') {
            return res
                .status(404)
                .json(new ApiResponse(null, "Response Received", false));
        }


        //otp
        const { genarateotp } = req.query;
        if (genarateotp) {
            //generate otp and save
            const otp = await generateOtp(
                process.env.OTP_LENGTH,
                process.env.OTP_ALPHANUMERIC
            );
            const result = await MasterInteractions.update(
                { otp: otp },
                { where: { id: interactionId } }
            );

            //mail
            let masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(interaction.companyid, 'INTERACTION', 'OTP');

            subject = masterCompanyMailConfiguration.dataValues.subject;
            body = masterCompanyMailConfiguration.dataValues.body;

            const projectName = project.dataValues.projectName;
            const projectCode = project.dataValues.projectCode;
            const accountName = company.dataValues.companyName;
            const spocName = interaction.spocname;

            subject = subject.replaceAll('${projectName}', projectName);
            subject = subject.replaceAll('${projectCode}', projectCode);
            subject = subject.replaceAll('${accountName}', accountName);

            body = body.replaceAll('${spocName}', spocName);
            body = body.replaceAll('${otp}', otp);

            const ccMails = [];
            await sendMail(interaction.dataValues.spocemail, body, subject, ccMails);

            //generate cipher which is encryption for interaction
            const cipher = encryption;

            //generate response data
            const data = {
                sentDate: interaction.dataValues.createdtime,
                projectId: project.dataValues.projectCode,
                assesmentYear: project.dataValues.accountingYear,
                projectName: project.dataValues.projectName,
                projectManager: project.dataValues.projectManager,
                technicalContact: project.dataValues.projectManager,
                name: interaction.dataValues.spocname,
                sentBy: 'system',
                clientName: company.dataValues.companyName,
                userEmail: interaction.dataValues.spocemail.replace(
                    /^(.{2}).*?(@.*)$/,
                    "$1****$2"
                ),
                cipher: cipher,
                supportEmail: process.env.SURVEY_SUPPORT_MAIL,
                company: process.env.SURVEY_COMPANY,
            };

            console.log(`Interaction | action:generate OTP | Link Triggered=${interaction.dataValues.url} | email=${interaction.dataValues.spocemail} | OTP=${otp}`);

            return res
                .status(200)
                .json(new ApiResponse(data, "OTP sent", true));
        }

        //generate response data
        const data = {
            sentDate: interaction.dataValues.createdtime,
            projectId: project.dataValues.projectCode,
            assesmentYear: project.dataValues.accountingYear,
            projectName: project.dataValues.projectName,
            projectManager: project.dataValues.projectManager,
            technicalContact: project.dataValues.projectManager,
            name: interaction.dataValues.spocname,
            sentBy: 'system',
            clientName: company.dataValues.companyName,
            userEmail: interaction.dataValues.spocemail.replace(
                /^(.{2}).*?(@.*)$/,
                "$1****$2"
            ),
            supportEmail: process.env.SURVEY_SUPPORT_MAIL,
            company: process.env.SURVEY_COMPANY,
        };

        console.log(`Interaction | action:verify link | Link Triggered=${interaction.dataValues.url} | email=${interaction.dataValues.spocemail}`);

        return res
            .status(200)
            .json(new ApiResponse(data, "Url verified", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const verifyOtpAndGetInteractionData = async (req, res) => {
    try {

        const { cipher, otp } = req.body;

        const { encryption } = req.params;

        const interactionId = crypto.decryptText(
            encryption,
            process.env.INTERACTIONS_CIPHER_KEY
        );
        //get interaction object
        const interaction = await MasterInteractions.findOne({
            where: {
                id: interactionId
            }
        });

        //get project
        const project = await Project.findOne({
            where: {
                projectId: interaction.dataValues.projectidentifier
            }
        });

        //get company
        const company = await Company.findOne({
            where: {
                companyId: project.dataValues.companyId
            }
        });

        //get status
        const status = await SystemStatus.findOne({
            where: {
                id: interaction.dataValues.statusid
            }
        });

        //check survey status
        if (status.dataValues.status == 'RESPONSE RECEIVED') {
            return res
                .status(404)
                .json(new ApiResponse(null, "Response Received", false));
        }

        //validate request body
        if (!cipher || !otp) {
            return res
                .status(400)
                .json(new ApiResponse(null, "Invalid request.", false));
        }

        //validate request
        //decrypt cipher and get interaction id
        const cipherInteraction = crypto.decryptText(
            cipher,
            process.env.SURVEY_CIPHER_KEY
        );

        if (interactionId != cipherInteraction) {
            return res.status(400).json(new ApiResponse(null, "Invalid Request.", false));
        }

        //verify otp
        if (interaction.dataValues.otp !== otp) {

            console.log(`Interaction | action:verify OTP success | Link Triggered=${interaction.dataValues.url} | email=${interaction.dataValues.spocemail} | OTP:${otp}`);

            return res.status(400).json(new ApiResponse(null, "Invalid Otp.", false));
        }

        //get questions and answers
        //get questions
        const questionsAndAnswers =
            await assessmentQueries.getQuestionsAndAnswers(interactionId);

        const data = {
            cipher: cipher,
            questionsAndAnswers: questionsAndAnswers,
            lastSaved: questionsAndAnswers[0].lastSaved
        };

        console.log(`Interaction | action:verify OTP success | Link Triggered=${interaction.dataValues.url} | email=${interaction.dataValues.spocemail} | OTP:${otp}`);

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

        const interactionId = crypto.decryptText(
            encryption,
            process.env.INTERACTIONS_CIPHER_KEY
        );
        //get interaction object
        const interaction = await MasterInteractions.findOne({
            where: {
                id: interactionId
            }
        });

        //get project
        const project = await Project.findOne({
            where: {
                projectId: interaction.dataValues.projectidentifier
            }
        });

        //get company
        const company = await Company.findOne({
            where: {
                companyId: project.dataValues.companyId
            }
        });

        //get status
        const status = await SystemStatus.findOne({
            where: {
                id: interaction.dataValues.statusid
            }
        });

        if (status.dataValues.status == 'RESPONSE RECEIVED') {
            return res
                .status(404)
                .json(new ApiResponse(null, "Response Received", false));
        }


        if (!cipher) {
            return res
                .status(404)
                .json(new ApiResponse(null, "Invalid Request", false));
        }

        //decrypt cipher and verify
        const cipherInteraction = crypto.decryptText(
            cipher,
            process.env.INTERACTIONS_CIPHER_KEY
        );
        if (interactionId != cipherInteraction) {
            return res.status(400).json(new ApiResponse(null, "Invalid Request.", false));
        }


        //filter out answer = null
        const answers = req.body.answers;

        // Filter the array to get only those objects where the answer is not null
        const answersList = answers.filter(answerObj => answerObj.answer !== null);

        //save answers
        for (const answerData of answersList) {
            const questionId = answerData.questionId;
            const answer = answerData.answer;

            const answerRecord = await MasterInteractionsQA.findOne({
                where: {
                    id: answerData.questionId
                }
            });

            answerRecord.answer = answer;
            answerRecord.saveddate = lastSaved;
            answerRecord.modifiedtime = new Date();
            answerRecord.modifiedby = 'external'

            await answerRecord.save();

        }

        if (submit) {
            console.log(`Interaction | action:submit answer | projectId=${project.dataValues.projectIdentifier} | interactionid=${interaction.dataValues.interactionsid}`);
        } else {
            console.log(`Interaction | action:save answer | projectId=${project.dataValues.projectIdentifier} | interactionid=${interaction.dataValues.interactionsid}`);
        }


        if (submit) {

            //get statusid for object master_interaction and status=RESPONSE RECEIVED
            const statusRecord = await SystemStatus.findOne({
                where: {
                    object: "master_interactions",
                    status: "RESPONSE RECEIVED",
                },
                attributes: ["id"], // Select only the id column
            });

            //change interaction status to closed
            await MasterInteractions.update(
                {
                    statusid: statusRecord.dataValues.id,
                    modifiedtime: new Date()
                },
                { where: { id: interactionId } }
            );

            //send response received mail
            let masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(interaction.companyid, 'INTERACTION', 'RESPONSE RECEIVED - USER');

            let subject = masterCompanyMailConfiguration.dataValues.subject;
            let body = masterCompanyMailConfiguration.dataValues.body;

            const accountName = company.dataValues.companyName;
            const projectCode = project.dataValues.projectCode;;
            const projectName = project.dataValues.projectName;
            const name = interaction.dataValues.spocname;
            const date = lastSaved;
            const support = process.env.SURVEY_SUPPORT_MAIL;;

            subject = subject.replaceAll('${interactionId}', interaction.dataValues.interactionsid);
            subject = subject.replaceAll('${accountName}', accountName);
            subject = subject.replaceAll('${projectCode}', projectCode);
            subject = subject.replaceAll('${projectName}', projectName);

            body = body.replaceAll('${name}', name);
            body = body.replaceAll('${projectName}', projectName);
            body = body.replaceAll('${projectCode}', projectCode);
            body = body.replaceAll('${date}', date);
            body = body.replaceAll('${support}', support);

            const ccMails = company.dataValues.interactionccMails ? company.dataValues.interactionccMails.split(',') : [];
            await sendMail(interaction.dataValues.spocemail, body, subject, ccMails);

            //send mail to the internal team
            masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(interaction.companyid, 'INTERACTION', 'RESPONSE RECEIVED - SUPPORT TEAM');

            subject = masterCompanyMailConfiguration.dataValues.subject;
            body = masterCompanyMailConfiguration.dataValues.body;

            subject = subject.replaceAll('${interactionId}', interaction.dataValues.interactionsid);
            subject = subject.replaceAll('${accountName}', accountName);
            subject = subject.replaceAll('${projectCode}', projectCode);
            subject = subject.replaceAll('${projectName}', projectName);

            body = body.replaceAll('${projectName}', projectName);
            body = body.replaceAll('${projectCode}', projectCode);
            body = body.replaceAll('${name}', name);
            body = body.replaceAll('${date}', date);

            await sendMail(process.env.SURVEY_CONFIRM_MAIL, body, subject, ccMails);

            console.log(`Interaction | action:Response received Thank you mail | projectId=${project.dataValues.projectIdentifier} | interactionid=${interaction.dataValues.interactionsid}`);

        }

        //change aistatus to unprocessed
        const questionsAndAnswers = await assessmentQueries.getQuestionsAndAnswers(interactionId);
        for (const question of questionsAndAnswers) {
            if (question.answer != null) {
                await MasterInteractionsQA.update(
                    { aistatus: 'unprocessed' },
                    { where: { id: question.questionId } }
                );
            }
        }

        //trigger ai apis
        //fire generate summary
        const triggerSummary = axiosRequest(
            "post",
            process.env.AI_GENERATE_SUMMARY,
            {
                companyId: project.dataValues.companyId,
                projectId: project.dataValues.projectId
            }
        );
        console.log(`Interaction | action:Trigger AI Summary | projectId=${project.dataValues.projectIdentifier} | interactionid=${interaction.dataValues.interactionsid}`);

        //fire generate assessment
        // const triggerAssessment = axiosRequest(
        //     "post",
        //     process.env.AI_GENERATE_ASSESSMENT,
        //     {
        //         companyId: project.dataValues.companyId,
        //         projectId: project.dataValues.projectIdentifier
        //     }
        // );
        // console.log(`Interaction | action:Trigger AI Assessment | projectId=${project.dataValues.projectIdentifier} | interactionid=${interaction.dataValues.interactionsid}`);


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
//upload interaction

const uploadInteractions = async (req, res) => {
    try {

        const userId = req.params.userId;

        //validate request
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json(new ApiResponse(null, "No files found", false));
        }

        intearctionSheetsProcessor(req.files, userId);

        return res.status(200).json(new ApiResponse(null, "Intearction sheets uploaded successfully", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

module.exports = {
    sendInteractions,
    authenticateLinkAndSendOtp,
    verifyOtpAndGetInteractionData,
    saveAnswer,
    createInteractions,
    sendInteractionsByUser,
    uploadInteractions
};