const XLSX = require("xlsx");
const sheetQueries = require("../queries/sheets.queries");
const Project = require("../models/project.model");
const MasterSheets = require("../models/master-sheets.model");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { axiosRequest } = require("../utils/axios");
const sheetsQueries = require("../queries/sheets.queries");
const MasterSheetsData = require("../models/master-sheets-data.model");
const PlatformUsers = require("../models/platform-users.model");
const { sendSheetFailMessage } = require("../utils/mailGraphApi");
const Company = require('../models/company.model');
const { uploadSheetToAzure } = require('../utils/azureBlobStorage');
const MasterCase = require("../models/master-case.model");
const caseQueries = require("../queries/case.queries");
const SystemSurveyQuestion = require("../models/system-survey-question.model");
const MasterSheet = require("../models/master-sheets.model");
const { sendMailForUploadedSheets, sendMail } = require("../utils/mailGraphApi");
const companyQueries = require("../queries/company.queries");
const Contact = require("../models/contact.model");
const TeamMembers = require("../models/teammembers.model");
const ContactSalary = require("../models/contact-salary.model");
const constants = require("../constants");
const projectQueries = require("../queries/project.queries");
const assessmentQueries = require("../queries/assessment.queries");
const MasterInteractions = require("../models/master-interactions.model");

async function projectsSheetsProcessor(userId, sheetId, companyId, file) {
    try {

        let {
            company,
            sheetData,
            acceptedRecords,
            rejectedRecords,
            sheetcolumnnameTocolumnname,
            emails, ccs, subject, highlight
        } = await basicSheetProcessing(userId, companyId, sheetId, file, 'projects');

        //insert data into projects
        for (const record of acceptedRecords) {

            delete record.rownumber;

            let projectData = {};
            for (key in record) {
                if (record[key] === '-') {
                    delete record[key];
                    continue;
                }
                const projectAttribute = sheetcolumnnameTocolumnname[key];
                if (projectAttribute) {
                    projectData[projectAttribute] = record[key];
                }
            }
            projectData.companyId = companyId;

            //conert the numbers to dates
            const dateColumns = ["startDate", "endDate", "actualStartDate", "actualEndDate"];
            Object.keys(projectData).forEach(key => {
                if (projectData[key] === "-") {
                    delete projectData[key]; // Remove key with value "-"
                } else if (dateColumns.includes(key) && typeof projectData[key] === 'number') {
                    // Convert Excel date numbers to JavaScript Date objects inline
                    const excelDate = projectData[key];
                    const unixTimestamp = (excelDate - 25569) * 86400 * 1000;
                    projectData[key] = new Date(unixTimestamp).toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
                }
            });

            let project = await Project.findOne({
                where: {
                    companyId: companyId,
                    projectCode: projectData.projectCode
                }
            })


            if (project) {
                project = project.dataValues;
                projectData.projectId = project.projectId;
                projectData.projectIdentifier = project.projectIdentifier;

                await Project.update(projectData, {
                    where: {
                        projectIdentifier: project.projectIdentifier
                    },
                });

                console.log(`Projects | action : Update Project From Sheet | Project Code : ${projectData.projectCode} | Project Name : ${projectData.projectName}`);

            } else {
                await Project.create(projectData);
                console.log(`Projects | action : Create Project From Sheet | Project Code : ${projectData.projectCode} | Project Name : ${projectData.projectName}`);
                await Project.update(projectData, {
                    where: {
                        projectCode: `'${projectData.projectCode}'`,
                        companyId: companyId
                    },
                });
            }
        }



        //update master_sheet status to processed
        const totalRecordsCount = sheetData.length;
        const acceptedRecordsCount = acceptedRecords.length;
        const rejectedRecordsCount = rejectedRecords.length;
        await MasterSheets.update(
            {
                message: "Sheet processed successfully.",
                status: "processed",
                totalrecords: totalRecordsCount,
                acceptedrecords: acceptedRecordsCount,
                rejectedrecords: rejectedRecordsCount
            },
            {
                where: { id: sheetId }
            }
        );

        await sheetQueries.updateProjectIds();


        // //Mandatory Cells missing : Send a Mail for projects
        // if (rejectedRecords.length > 0) {

        //     rejectedRecords = rejectedRecords.map(record => {
        //         // Get the keys of the object and sort them
        //         const sortedKeys = Object.keys(record).sort();

        //         // Create a new object with the sorted keys
        //         const sortedRecord = {};
        //         sortedKeys.forEach(key => {
        //             sortedRecord[key] = record[key];
        //         });

        //         return sortedRecord;
        //     });

        //     let table = '<table border="1" cellpadding="10">';
        //     table += '<tr>';
        //     for (let key in rejectedRecords[0]) {
        //         table += `<th>${key}</th>`;
        //     }
        //     table += '</tr>';
        //     rejectedRecords.forEach(item => {
        //         table += '<tr>';
        //         for (let key in item) {
        //             table += `<td>${item[key]}</td>`;
        //         }
        //         table += '</tr>';
        //     });
        //     table += '</table>';


        //     const body = `
        //     The sheet that you have uploaded for the Account : <b>${company.dataValues.companyName}</b> has some missing values or incorrect data.</br>
        //     File Name: ${file.originalname}</br>
        //     Please review the sheet and upload again.
        //     ${table}
        //     `;

        //     await sendSheetFailMessage(emails, ccs, subject, body);
        // }


        // trigger AI for projects
        // for (const stageData of insertData) {
        //     const project = await sheetQueries.getProject(companyId, stageData.projectcode);

        //     const triggerSummary = axiosRequest(
        //         "post",
        //         process.env.AI_GENERATE_SUMMARY,
        //         {
        //             projectId: project.projectId,
        //             companyId: companyId
        //         }
        //     );
        // }


        let sendFailedSheetMail = false;
        for (const key in highlight) {
            if (highlight[key].length > 0) {
                sendFailedSheetMail = true;
                break;
            }
        }
        if (sendFailedSheetMail) {
            const table = await generateHighlightedHTML(file, highlight);
            const body = `
                The sheet that you have uploaded for the Account : <b>${company.dataValues.companyName}</b> has some missing values or incorrect data.</br>
                File Name: ${file.originalname}</br>
                Please review the sheet and upload again.
                ${table}
            `;
            await sendSheetFailMessage(emails, ccs, subject, body);
        }

        fs.unlinkSync(file.path);

    } catch (error) {
        await MasterSheets.update(
            {
                status: 'failed',
            },  // Fields to update
            { where: { id: sheetId } }  // Condition to match
        );
        console.error("Error processing projects sheet:", error.message);
    }
}

async function generateHighlightedHTML(file, highlight) {
    try {
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '-' });

        let html = '<table border="1" cellpadding="5" style="border-collapse: collapse;">';

        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
            if ((rowIndex + 1 in highlight) && !(rowIndex + 1 == 1) && highlight[rowIndex + 1].length == 0) {
                continue;
            }
            html += '<tr>';
            for (let colIndex = 0; colIndex < data[rowIndex].length; colIndex++) {
                let highlightClass = '';

                if (highlight[rowIndex + 1] && highlight[rowIndex + 1].includes(data[0][colIndex])) {
                    highlightClass = 'background-color: red;';
                }

                html += `<td style="${highlightClass} padding: 5px;">${data[rowIndex][colIndex]}</td>`;
            }
            html += '</tr>';
        }

        html += '</table>';
        return html;
    } catch (error) {
        console.error('Error generating highlighted HTML:', error);
        return '<p>Error processing the sheet.</p>';
    }
}

async function surveySheetsProcessor(files, userId, caseId) {
    try {

        //get case
        let platformUser = await PlatformUsers.findOne({ where: { userId: userId } });
        platformUser = platformUser.dataValues;
        const userName = platformUser.firstName + ' ' + platformUser.middleName + ' ' + platformUser.lastName;
        const email = platformUser.email;

        let masterCase = await MasterCase.findOne({ where: { id: caseId } });
        masterCase = masterCase.dataValues;

        let acceptedSheets = [];
        let rejectedFiles = [];
        let acceptedFiles = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const workbook = XLSX.readFile(file.path);

            for (let j = 0; j < workbook.SheetNames.length; j++) {
                const sheetName = workbook.SheetNames[j];
                const sheet = workbook.Sheets[sheetName];

                //upload file to azure
                const { url, cloudStatus, cloudMessage } = await uploadSheetToAzure(file);

                //update master sheets table
                const masterSheetData = {
                    id: uuidv4(),
                    sheettype: "surveys",
                    sheetname: file.originalname,
                    url: url,
                    companyid: masterCase.companyid,
                    createdby: userId,
                    caseId: caseId,
                    status: cloudStatus ? cloudStatus : "uploaded",
                    message: cloudMessage ? cloudMessage : null
                };
                const savedSheet = await MasterSheet.create(masterSheetData);

                if (cloudStatus == 'failed') {
                    rejectedSheets.push({
                        fileName: file.originalname,
                        message: cloudMessage
                    });
                    continue;
                }


                //dynamic questions and answers store
                let projectCode = sheet['B2'] ? sheet['B2'].v : null;
                let companyId = masterCase.companyid;
                let systemSurveyQuestions = await caseQueries.getProjectSurveyQuestions(projectCode, companyId);
                const count = systemSurveyQuestions.length;

                let questionsAndAnswers = {};
                for (let questionCount = 0; questionCount < count; questionCount++) {
                    const question = sheet[`A${questionCount + 6}`].v;
                    const answer = sheet[`B${questionCount + 6}`].v;
                    questionsAndAnswers[question] = answer;
                }

                //convert sheet to object
                // question1 = sheet['A5'] ? sheet['A5'].v : null;
                // question2 = sheet['A6'] ? sheet['A6'].v : null;
                // question3 = sheet['A7'] ? sheet['A7'].v : null;
                // question4 = sheet['A8'] ? sheet['A8'].v : null;
                // question5 = sheet['A9'] ? sheet['A9'].v : null;

                // answer1 = sheet['B5'] ? sheet['B5'].v : null;
                // answer2 = sheet['B6'] ? sheet['B6'].v : null;
                // answer3 = sheet['B7'] ? sheet['B7'].v : null;
                // answer4 = sheet['B8'] ? sheet['B8'].v : null;
                // answer5 = sheet['B9'] ? sheet['B9'].v : null;

                let sheetQuestionsAndAnswers = {};

                // const questionsAndAnswers = {
                //     [question1]: answer1,
                //     [question2]: answer2,
                //     [question3]: answer3,
                //     [question4]: answer4,
                //     [question5]: answer5
                // };

                Object.keys(questionsAndAnswers).forEach(question => {
                    if (question) {
                        sheetQuestionsAndAnswers[question] = questionsAndAnswers[question];
                    }
                });

                let sheetData = {
                    caseId: caseId,
                    companyId: masterCase.companyid,
                    projectCode: sheet['B2'] ? sheet['B2'].v : null,
                    systemSurveyQuestions: systemSurveyQuestions,
                    sheetQuestionsAndAnswers: sheetQuestionsAndAnswers
                };


                let { data, evaluateMessage, evaluateStatus } = await evaluateSurveySheet(sheetData);

                await MasterSheet.update(
                    {
                        message: evaluateMessage ? evaluateMessage : null,
                        status: evaluateStatus ? evaluateStatus : null,
                        projectid: evaluateStatus != 'failed' && data.projectId ? data.projectId : null,
                        caseid: caseId
                    },
                    {
                        where: { id: savedSheet.id }
                    }
                );

                if (evaluateStatus == 'failed') {
                    rejectedFiles.push({
                        fileName: file.originalname,
                        message: evaluateMessage
                    });
                    continue;
                }

                data.sheetId = savedSheet.id;
                data.companyId = masterCase.companyid;
                data.userName = userName;
                data.fileName = file.originalname;

                acceptedSheets.push(data);
            }

            fs.unlinkSync(file.path);
        }

        //update survey answers
        for (const sheet of acceptedSheets) {
            const { status, message } = await caseQueries.updateSurveyAnswersFromSheet(sheet);

            await MasterSheet.update(
                {
                    status: status,
                    message: message,
                    projectid: sheet.projectId
                },
                {
                    where: { id: sheet.sheetId }
                }
            );

            if (status == 'failed') {
                rejectedFiles.push({
                    fileName: sheet.fileName,
                    message: evaluateMessage
                });
            } else {
                acceptedFiles.push({
                    fileName: sheet.fileName
                });

                //call technical summary generate
                const triggerSummary = axiosRequest(
                    "post",
                    process.env.AI_GENERATE_SUMMARY,
                    {
                        companyId: sheet.companyId,
                        projectId: sheet.projectId
                    }
                );
                console.log(`Survey | action:Trigger AI Summary | projectId=${sheet.projectId}`);


                //send mail to the internal team
                const email = process.env.SURVEY_CONFIRM_MAIL;
                //get mail body
                const masterCompanyMailConfiguration = await companyQueries.getOrCreateCompanyMailConfiguration(sheet.companyId, "SURVEY", "RESPONSE RECEIVED - SUPPORT TEAM");

                body = masterCompanyMailConfiguration.dataValues.body;
                body = body.replace("${name}", userName);
                body = body.replace("${projectId}", sheet.projectId);
                body = body.replace("${projectName}", sheet.projectName);
                body = body.replace("${date}", new Date().toISOString().slice(0, 19).replace('T', ' '));

                subject = masterCompanyMailConfiguration.dataValues.subject;
                subject = subject.replace("${accountName}", sheet.companyName);
                subject = subject.replace("${projectId}", sheet.projectId);
                subject = subject.replace("${projectName}", sheet.projectName);

                const ccMails = [];

                await sendMail(email, body, subject, ccMails);
            }

        }

        await sendMailForUploadedSheets(acceptedFiles, rejectedFiles, userName, email);

    } catch (error) {
        console.error("Error Updating Survey Answers From Sheet wages dates :", error);
    }
};

async function evaluateSurveySheet(sheetData) {
    try {

        const { caseId, companyId, projectCode,
            systemSurveyQuestions, sheetQuestionsAndAnswers
        } = sheetData;

        //validate project
        const project = await Project.findOne({ where: { companyId: companyId, projectCode: projectCode } });
        const company = await Company.findOne({ where: { companyId: companyId } });
        if (!project) {
            return {
                data: {
                    projectId: null
                },
                evaluateMessage: 'Invalid Project Code',
                evaluateStatus: 'failed'
            };
        }

        //check survey status
        const surveyDetails = await caseQueries.getSurveyDetailsOfProject(caseId, project.projectId);

        if (!surveyDetails) {
            return {
                data: {
                    projectid: project.dataValues.projectId
                },
                evaluateMessage: 'Survey Does not Exist',
                evaluateStatus: 'failed'
            };
        }

        if (surveyDetails.surveyStatus == 'RESPONSE RECEIVED') {
            return {
                data: {
                    projectId: project.projectId
                },
                evaluateMessage: 'Survey Response Received',
                evaluateStatus: 'failed'
            };
        }

        //match questions from sheet and fill data
        let surveyData = {};
        for (const key in sheetQuestionsAndAnswers) {
            const sheetQuestion = key;

            let questionFound = false;

            for (const record of systemSurveyQuestions) {
                const systemQuestion = record.question;

                if (sheetQuestion == systemQuestion) {
                    questionFound = true;

                    surveyData[record.sequence] = {
                        questionId: record.id,
                        answer: sheetQuestionsAndAnswers[key]
                    }
                }
            }

            if (!questionFound) {
                return {
                    data: {
                        projectId: project.dataValues.projectId
                    },
                    evaluateMessage: 'Invalid questions / questions not found in sheet',
                    evaluateStatus: 'failed'
                };
            }
        }

        const data = {
            projectId: project.dataValues.projectId,
            projectName: project.dataValues.projectName,
            companyName: company.dataValues.companyName,
            surveyData: surveyData,
            surveyId: surveyDetails.surveyId,
            surveyControlId: surveyDetails.surveyControlId,
            surveyAssignmentId: surveyDetails.surveyAssignmentId
        }

        return { data, evaluateStatus: 'processing' };

    } catch (error) {
        console.log("Error evaluating survey sheet : ", error);
        return {
            evaluateMessage: 'Sheet Evaluation Failed | Internal Server Error',
            evaluateStatus: 'failed'
        }
    }
}


async function employeeSheetProcessor(userId, companyId, sheetId, file) {
    try {

        //get company
        const company = await Company.findOne({ where: { companyId: companyId } });

        //set status to processing
        await MasterSheets.update(
            { status: 'processing' },  // Fields to update
            { where: { id: sheetId } }  // Condition to match
        );

        // get projects sheet mapper
        const sheetType = 'employee';
        let employeeMapper = await sheetQueries.getCompanyMapper(companyId, sheetType);
        //if there is no mapper create one
        if (!employeeMapper) {
            await sheetsQueries.createCompanyEmployeeMapper(companyId);
            employeeMapper = await sheetQueries.getCompanyMapper(companyId, sheetType);
        }


        //convert xlsx data to json
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let sheetData = XLSX.utils.sheet_to_json(sheet);
        fs.unlinkSync(file.path);


        //get user details for missing data in sheet for mail
        let userEmail = await PlatformUsers.findOne({
            where: {
                userId: userId
            }
        });
        userEmail = userEmail.dataValues.email;
        //send a mail details
        const subject = `Upload Employee Sheet Failed for ${company.dataValues.companyName}`;
        const emails = [];
        emails.push(process.env.SURVEY_SUPPORT_MAIL);
        const ccs = [];
        ccs.push(userEmail);


        //check if mandatory columns are missing in sheet
        const mandatorySheetColumns = await sheetQueries.getMandatorySheetColumns(companyId, sheetType);
        //get sheet column names
        const missingColumn = new Set();
        for (const element of mandatorySheetColumns) {
            let count = 0;
            for (const record of sheetData) {
                if (!(element in record)) {
                    mandatoryColumnMissing = true;
                    count++;
                }
            }
            if (count == sheetData.length) {
                missingColumn.add(element);
            }
        }


        //Mandatory Columns missing : Send a Mail
        if (missingColumn.size > 0) {
            await MasterSheets.update(
                {
                    message: "Missing columns in the sheet.",
                    status: "failed"
                },
                {
                    where: { id: sheetId }
                }
            );

            //send mail
            let missingColumnNames = Array.from(missingColumn).join(', ');
            const body = `
            The sheet that you have uploaded for the Account : <b>${company.dataValues.companyName}</b> has some missing columns.</br>
            File Name: ${file.originalname}</br>
            Missing Columns : ${missingColumnNames}.</br>
            Please review the sheet and upload again.</br></br>
            `;

            await sendSheetFailMessage(emails, ccs, subject, body);

            return;
        }


        //set the mssing values to "-"
        const maxKeysObject = sheetData.reduce((maxObj, currentObj) => {
            return Object.keys(currentObj).length > Object.keys(maxObj).length ? currentObj : maxObj;
        }, {});

        // Get the keys of that object
        const maxKeysArray = Object.keys(maxKeysObject);

        // Update all objects to ensure they have all the keys from maxKeysArray
        const updatedSheetData = sheetData.map(obj => {
            maxKeysArray.forEach(key => {
                if (!obj.hasOwnProperty(key)) {
                    obj[key] = "-";
                }
            });
            return obj;
        });


        //Filter which records to store in Projects Table
        let acceptedRecords = [];
        let rejectedRecords = [];

        for (let record of sheetData) {

            //validate the record
            let mandatoryCellMissing = false;
            for (const element of mandatorySheetColumns) {
                if (record[element] == "-") {
                    rejectedRecords.push(record);
                    mandatoryCellMissing = true;
                    break;
                }
            }
            if (mandatoryCellMissing) {
                continue;
            }

            acceptedRecords.push(record);
        }


        //insert records in master_sheets_data for accepted and rejected records
        for (const record of acceptedRecords) {
            await MasterSheetsData.create({
                id: uuidv4(),
                companyid: companyId,
                sheetid: sheetId,
                status: 'accepted',
                record: JSON.stringify(record)
            });
        }

        for (const record of rejectedRecords) {
            await MasterSheetsData.create({
                id: uuidv4(),
                companyid: companyId,
                sheetid: sheetId,
                status: 'rejected',
                record: JSON.stringify(record)
            });
        }


        //Mandatory Cells missing : Send a Mail
        if (rejectedRecords.length > 0) {

            rejectedRecords = rejectedRecords.map(record => {
                // Get the keys of the object and sort them
                const sortedKeys = Object.keys(record).sort();

                // Create a new object with the sorted keys
                const sortedRecord = {};
                sortedKeys.forEach(key => {
                    sortedRecord[key] = record[key];
                });

                return sortedRecord;
            });

            let table = '<table border="1" cellpadding="10">';
            table += '<tr>';
            for (let key in rejectedRecords[0]) {
                table += `<th>${key}</th>`;
            }
            table += '</tr>';
            rejectedRecords.forEach(item => {
                table += '<tr>';
                for (let key in item) {
                    table += `<td>${item[key]}</td>`;
                }
                table += '</tr>';
            });
            table += '</table>';


            const body = `
            The sheet that you have uploaded for the Account : <b>${company.dataValues.companyName}</b> has some missing values.</br>
            File Name: ${file.originalname}</br>
            Please review the sheet and upload again.
            ${table}
            </br></br>
            `;

            await sendSheetFailMessage(emails, ccs, subject, body);
        }


        //get sheetColumnName wrt columnName
        const sheetcolumnnameTocolumnname = await sheetQueries.getSheetcolumnnamesToColumnnames(companyId, sheetType);

        //insert data into projects
        for (const record of acceptedRecords) {

            let contactData = {};
            for (key in record) {
                const contactAttribute = sheetcolumnnameTocolumnname[key];
                if (contactAttribute) {
                    contactData[contactAttribute] = record[key];
                }
            }
            contactData.companyId = companyId;

            let contact = await Contact.findOne({
                where: {
                    companyId: companyId,
                    employeeId: contactData.employeeId
                }
            })


            if (contact) {
                contact = contact.dataValues;

                await Contact.update(contactData, {
                    where: {
                        employeeId: contact.contactId
                    },
                });

                console.log(`Contacts | action : Update Contact From Sheet | Contact ID : ${contact.contactId}`);

            } else {
                contactData.contactId = uuidv4();
                await Contact.create(contactData);
                console.log(`Contacts | action : Create Contact From Sheet | Contact ID : ${contactData.contactId}`);
            }
        }



        //update master_sheet status to processed
        const totalRecordsCount = sheetData.length;
        const acceptedRecordsCount = acceptedRecords.length;
        const rejectedRecordsCount = rejectedRecords.length;
        await MasterSheets.update(
            {
                message: "Sheet processed successfully.",
                status: "processed",
                totalrecords: totalRecordsCount,
                acceptedrecords: acceptedRecordsCount,
                rejectedrecords: rejectedRecordsCount
            },
            {
                where: { id: sheetId }
            }
        );

    } catch (error) {
        await MasterSheets.update(
            {
                status: 'failed',
                message: 'Internal Server Error'
            },
            { where: { id: sheetId } }
        );
        console.error("Error processing employee sheet:", error.message);
    }
}


async function projectTeamSheetProcessor(userId, companyId, sheetId, file) {
    try {

        //get company
        const company = await Company.findOne({ where: { companyId: companyId } });

        //set status to processing
        await MasterSheets.update(
            { status: 'processing' },  // Fields to update
            { where: { id: sheetId } }  // Condition to match
        );

        // get projects sheet mapper
        const sheetType = 'project team';
        let employeeMapper = await sheetQueries.getCompanyMapper(companyId, sheetType);
        //if there is no mapper create one
        if (!employeeMapper) {
            await sheetsQueries.createCompanyProjectTeamMapper(companyId);
            employeeMapper = await sheetQueries.getCompanyMapper(companyId, sheetType);
        }


        //convert xlsx data to json
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let sheetData = XLSX.utils.sheet_to_json(sheet);
        fs.unlinkSync(file.path);


        //get user details for missing data in sheet for mail
        let userEmail = await PlatformUsers.findOne({
            where: {
                userId: userId
            }
        });
        userEmail = userEmail.dataValues.email;
        //send a mail details
        const subject = `Upload Project Team Sheet Failed for ${company.dataValues.companyName}`;
        const emails = [];
        emails.push(process.env.SURVEY_SUPPORT_MAIL);
        const ccs = [];
        ccs.push(userEmail);


        //check if mandatory columns are missing in sheet
        const mandatorySheetColumns = await sheetQueries.getMandatorySheetColumns(companyId, sheetType);
        //get sheet column names
        const missingColumn = new Set();
        for (const element of mandatorySheetColumns) {
            let count = 0;
            for (const record of sheetData) {
                if (!(element in record)) {
                    mandatoryColumnMissing = true;
                    count++;
                }
            }
            if (count == sheetData.length) {
                missingColumn.add(element);
            }
        }


        //Mandatory Columns missing : Send a Mail
        if (missingColumn.size > 0) {
            await MasterSheets.update(
                {
                    message: "Missing columns in the sheet.",
                    status: "failed"
                },
                {
                    where: { id: sheetId }
                }
            );

            //send mail
            let missingColumnNames = Array.from(missingColumn).join(', ');
            const body = `
            The sheet that you have uploaded for the Account : <b>${company.dataValues.companyName}</b> has some missing columns.</br>
            File Name: ${file.originalname}</br>
            Missing Columns : ${missingColumnNames}.</br>
            Please review the sheet and upload again.</br></br>
            `;

            await sendSheetFailMessage(emails, ccs, subject, body);

            return;
        }


        //set the mssing values to "-"
        const maxKeysObject = sheetData.reduce((maxObj, currentObj) => {
            return Object.keys(currentObj).length > Object.keys(maxObj).length ? currentObj : maxObj;
        }, {});

        // Get the keys of that object
        const maxKeysArray = Object.keys(maxKeysObject);

        // Update all objects to ensure they have all the keys from maxKeysArray
        const updatedSheetData = sheetData.map(obj => {
            maxKeysArray.forEach(key => {
                if (!obj.hasOwnProperty(key)) {
                    obj[key] = "-";
                }
            });
            return obj;
        });


        //Filter which records to store in Projects Table
        let acceptedRecords = [];
        let rejectedRecords = [];

        for (let record of sheetData) {

            //validate the record
            let mandatoryCellMissing = false;
            for (const element of mandatorySheetColumns) {
                if (record[element] == "-") {
                    rejectedRecords.push(record);
                    mandatoryCellMissing = true;
                    break;
                }
            }
            if (mandatoryCellMissing) {
                continue;
            }

            acceptedRecords.push(record);
        }


        //insert records in master_sheets_data for accepted and rejected records
        for (const record of acceptedRecords) {
            await MasterSheetsData.create({
                id: uuidv4(),
                companyid: companyId,
                sheetid: sheetId,
                status: 'accepted',
                record: JSON.stringify(record)
            });
        }

        for (const record of rejectedRecords) {
            await MasterSheetsData.create({
                id: uuidv4(),
                companyid: companyId,
                sheetid: sheetId,
                status: 'rejected',
                record: JSON.stringify(record)
            });
        }

        //get sheetColumnName wrt columnName
        const sheetcolumnnameTocolumnname = await sheetQueries.getSheetcolumnnamesToColumnnames(companyId, sheetType);

        //insert data into projects
        for (const record of acceptedRecords) {

            let teammemberData = {};
            for (key in record) {
                const contactAttribute = sheetcolumnnameTocolumnname[key];
                if (contactAttribute) {
                    teammemberData[contactAttribute] = record[key];
                }
            }
            teammemberData.companyId = companyId;

            let project = await Project.findOne({ where: { companyId: companyId, projectCode: teammemberData.projectCode } });
            if (!project) {
                rejectedRecords.push(record);
                mandatoryCellMissing = true;
                continue;
            }

            let teamMember = await TeamMembers.findOne({ where: { companyId: companyId, employeeid: teammemberData.employeeid, projectId: project.dataValues.projectId } });
            let contact = await Contact.findOne({ where: { companyId: companyId, employeeId: teammemberData.employeeid } });

            delete teammemberData.projectCode;
            teammemberData.projectId = project.dataValues.projectId;

            //deleteItems
            const items = ["employementType", "employeeTitle", "firstName", "email", "phone", "Address", "Language", "status", "city", "state"];
            //Team Member exists
            if (teamMember && contact) {
                teamMember = teamMember.dataValues;

                //delete extras
                for (let key in teammemberData) {
                    for (const deleteKey of items) {
                        if (deleteKey == key) {
                            delete teammemberData[deleteKey];
                        }
                    }
                }

                await TeamMembers.update(teammemberData, {
                    where: {
                        contactId: teamMember.contactId
                    },
                });

                console.log(`Teammember | action : Update Project Team Member From Sheet | Teammember ID : ${teamMember.teamMemberId}`);

            } else if (!teamMember && contact) {
                //delete extras
                for (let key in teammemberData) {
                    for (const deleteKey of items) {
                        if (deleteKey == key) {
                            delete teammemberData[deleteKey];
                        }
                    }
                }
                teammemberData.teamMemberId = uuidv4();
                teammemberData.contactId = contact.dataValues.contactId;
                await TeamMembers.create(teammemberData);
                console.log(`Teammember | action : Create Project Team From Sheet | Teammember ID : ${teammemberData.teamMemberId}`);
            } else {
                let contactData = {};
                contactData.employeeId = teammemberData.employeeid;
                contactData.contactId = uuidv4();
                contactData.companyId = companyId;
                for (const item of items) {
                    if (item in teammemberData) {
                        contactData[item] = teammemberData[item];
                    }
                }

                for (let key in teammemberData) {
                    for (const deleteKey of items) {
                        if (deleteKey == key) {
                            delete teammemberData[deleteKey];
                        }
                    }
                }
                teammemberData.teamMemberId = uuidv4();
                teammemberData.contactId = contactData.contactId;

                await Contact.create(contactData);
                await TeamMembers.create(teammemberData);

                console.log(`Teammember | action : Create Project Team From Sheet | Teammember ID : ${teammemberData.teamMemberId}`);
            }
        }


        //Mandatory Cells missing : Send a Mail
        if (rejectedRecords.length > 0) {

            rejectedRecords = rejectedRecords.map(record => {
                // Get the keys of the object and sort them
                const sortedKeys = Object.keys(record).sort();

                // Create a new object with the sorted keys
                const sortedRecord = {};
                sortedKeys.forEach(key => {
                    sortedRecord[key] = record[key];
                });

                return sortedRecord;
            });

            let table = '<table border="1" cellpadding="10">';
            table += '<tr>';
            for (let key in rejectedRecords[0]) {
                table += `<th>${key}</th>`;
            }
            table += '</tr>';
            rejectedRecords.forEach(item => {
                table += '<tr>';
                for (let key in item) {
                    table += `<td>${item[key]}</td>`;
                }
                table += '</tr>';
            });
            table += '</table>';


            const body = `
            The sheet that you have uploaded for the Account : <b>${company.dataValues.companyName}</b> has some missing values.</br>
            File Name: ${file.originalname}</br>
            Please review the sheet and upload again.
            ${table}
            </br></br>
            `;

            await sendSheetFailMessage(emails, ccs, subject, body);
        }

        //update master_sheet status to processed
        const totalRecordsCount = sheetData.length;
        const acceptedRecordsCount = acceptedRecords.length;
        const rejectedRecordsCount = rejectedRecords.length;
        await MasterSheets.update(
            {
                message: "Sheet processed successfully.",
                status: "processed",
                totalrecords: totalRecordsCount,
                acceptedrecords: acceptedRecordsCount,
                rejectedrecords: rejectedRecordsCount
            },
            {
                where: { id: sheetId }
            }
        );

    } catch (error) {
        await MasterSheets.update(
            {
                status: 'failed',
                message: 'Internal Server Error'
            },
            { where: { id: sheetId } }
        );
        console.error("Error processing employee sheet:", error.message);
    }
}


async function payrollSheetProcessor(userId, companyId, sheetId, file) {
    try {

        let {
            company,
            sheetData,
            acceptedRecords,
            rejectedRecords,
            sheetcolumnnameTocolumnname,
            emails, ccs, subject
        } = await basicSheetProcessing(userId, companyId, sheetId, file, 'payroll');

        //insert data into projects
        for (const record of acceptedRecords) {

            let contactSalaryData = {};
            for (key in record) {
                const contactAttribute = sheetcolumnnameTocolumnname[key];
                if (contactAttribute) {
                    contactSalaryData[contactAttribute] = record[key];
                }
            }

            let contact = await Contact.findOne({ where: { companyId: companyId, employeeId: contactSalaryData.employeeId } });
            if (!contact) {
                rejectedRecords.push(record);
                continue;
            }
            contact = contact.dataValues;

            contactSalaryData.contactSalaryId = uuidv4();
            contactSalaryData.contactId = contact.contactId;
            contactSalaryData.createdBy = 'system';
            delete contactSalaryData.employeeId;

            await ContactSalary.create(contactSalaryData);
        }


        //Mandatory Cells missing : Send a Mail
        if (rejectedRecords.length > 0) {

            rejectedRecords = rejectedRecords.map(record => {
                // Get the keys of the object and sort them
                const sortedKeys = Object.keys(record).sort();

                // Create a new object with the sorted keys
                const sortedRecord = {};
                sortedKeys.forEach(key => {
                    sortedRecord[key] = record[key];
                });

                return sortedRecord;
            });

            let table = '<table border="1" cellpadding="10">';
            table += '<tr>';
            for (let key in rejectedRecords[0]) {
                table += `<th>${key}</th>`;
            }
            table += '</tr>';
            rejectedRecords.forEach(item => {
                table += '<tr>';
                for (let key in item) {
                    table += `<td>${item[key]}</td>`;
                }
                table += '</tr>';
            });
            table += '</table>';


            const body = `
            The sheet that you have uploaded for the Account : <b>${company.dataValues.companyName}</b> has some missing values.</br>
            File Name: ${file.originalname}</br>
            Please review the sheet and upload again.
            ${table}
            </br></br>
            `;

            await sendSheetFailMessage(emails, ccs, subject, body);
        }

        //update master_sheet status to processed
        const totalRecordsCount = sheetData.length;
        const acceptedRecordsCount = acceptedRecords.length;
        const rejectedRecordsCount = rejectedRecords.length;
        await MasterSheets.update(
            {
                message: "Sheet processed successfully.",
                status: "processed",
                totalrecords: totalRecordsCount,
                acceptedrecords: acceptedRecordsCount,
                rejectedrecords: rejectedRecordsCount
            },
            {
                where: { id: sheetId }
            }
        );
    } catch (error) {
        await MasterSheets.update(
            {
                status: 'failed',
                message: 'Internal Server Error'
            },
            { where: { id: sheetId } }
        );
        console.error("Error processing payroll sheet:", error.message);
    }
}


async function basicSheetProcessing(userId, companyId, sheetId, file, sheetType) {
    try {
        //get company
        const company = await Company.findOne({ where: { companyId: companyId } });

        //set status to processing
        await MasterSheets.update(
            { status: 'processing' },  // Fields to update
            { where: { id: sheetId } }  // Condition to match
        );

        // get projects sheet mapper
        let sheetMapper = await sheetQueries.getCompanyMapper(companyId, sheetType);
        //if there is no mapper create one
        if (!sheetMapper) {
            switch (sheetType) {
                case 'payroll': await sheetsQueries.createCompanyPayrollMapper(companyId);
                    break;
                case 'projects': await sheetsQueries.createCompanyProjectMapper(companyId);
                    break;
                case 'employee': await sheetsQueries.createCompanyEmployeeMapper(companyId);
                    break;
                case 'project team': await sheetsQueries.createCompanyProjectTeamMapper(companyId);
                    break;
            }
            sheetMapper = await sheetQueries.getCompanyMapper(companyId, sheetType);
        }


        //convert xlsx data to json
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to JSON
        let sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Get the headers from the first row
        const headers = sheetData[0];

        let highlight = {};

        // Convert data into an array of objects with row numbers
        sheetData = sheetData.slice(1).map((row, index) => {
            let rowData = {};
            headers.forEach((header, colIndex) => {
                rowData[header] = row[colIndex];
            });
            rowData["rownumber"] = index + 2; // Adding 2 because index starts from 0, and row numbers start from 2 (1-based index)
            highlight[index + 2] = [];
            return rowData;
        });


        //get user details for missing data in sheet for mail
        let userEmail = await PlatformUsers.findOne({
            where: {
                userId: userId
            }
        });
        userEmail = userEmail.dataValues.email;
        //send a mail details
        const subject = `Upload Sheet Failed for ${company.dataValues.companyName}`;
        const emails = [];
        emails.push(process.env.SURVEY_SUPPORT_MAIL);
        const ccs = [];
        ccs.push(userEmail);


        //check if mandatory columns are missing in sheet
        const mandatorySheetColumns = await sheetQueries.getMandatorySheetColumns(companyId, sheetType);
        //get sheet column names
        const missingColumn = new Set();
        for (const element of mandatorySheetColumns) {
            let count = 0;
            for (const record of sheetData) {
                if (!(element in record)) {
                    mandatoryColumnMissing = true;
                    count++;
                }
            }
            if (count == sheetData.length) {
                missingColumn.add(element);
            }
        }


        //Mandatory Columns missing : Send a Mail
        if (missingColumn.size > 0) {
            await MasterSheets.update(
                {
                    message: "Missing columns in the sheet.",
                    status: "failed"
                },
                {
                    where: { id: sheetId }
                }
            );

            //send mail
            let missingColumnNames = Array.from(missingColumn).join(', ');
            const body = `
            The sheet that you have uploaded for the Account : <b>${company.dataValues.companyName}</b> has some missing columns.</br>
            File Name: ${file.originalname}</br>
            Missing Columns : ${missingColumnNames}.</br>
            Please review the sheet and upload again.</br></br>
            `;

            await sendSheetFailMessage(emails, ccs, subject, body);

            return;
        }


        //set the mssing values to "-"
        const maxKeysObject = sheetData.reduce((maxObj, currentObj) => {
            return Object.keys(currentObj).length > Object.keys(maxObj).length ? currentObj : maxObj;
        }, {});

        // Get the keys of that object
        const maxKeysArray = Object.keys(maxKeysObject);

        // Update all objects to ensure they have all the keys from maxKeysArray
        sheetData = sheetData.map(obj => {
            return maxKeysArray.reduce((acc, key) => {
                acc[key] = obj.hasOwnProperty(key) && obj[key] !== undefined ? obj[key] : "-";
                return acc;
            }, { ...obj });
        });



        //Filter which records to store in Projects Table
        let acceptedRecords = [];
        let rejectedRecords = [];

        for (let record of sheetData) {

            //validate the record
            let mandatoryCellMissing = false;
            for (const element of mandatorySheetColumns) {
                if (record[element] == "-") {
                    rejectedRecords.push(record);
                    mandatoryCellMissing = true;

                    highlight[record.rownumber].push(element);
                    break;
                }
            }
            if (mandatoryCellMissing) {
                continue;
            }

            acceptedRecords.push(record);
        }


        //insert records in master_sheets_data for accepted and rejected records
        for (const record of acceptedRecords) {
            await MasterSheetsData.create({
                id: uuidv4(),
                companyid: companyId,
                sheetid: sheetId,
                status: 'accepted',
                record: JSON.stringify(record)
            });
        }

        for (const record of rejectedRecords) {
            await MasterSheetsData.create({
                id: uuidv4(),
                companyid: companyId,
                sheetid: sheetId,
                status: 'rejected',
                record: JSON.stringify(record)
            });
        }

        //get sheetColumnName wrt columnName
        const sheetcolumnnameTocolumnname = await sheetQueries.getSheetcolumnnamesToColumnnames(companyId, sheetType);


        //data type validation and conversion
        let cellDataTypes;
        switch (sheetType) {
            case 'payroll': cellDataTypes = constants.PAYROLL_SHEET_VALUE_DATA_TYPES;
                break;
            case 'projects': cellDataTypes = constants.PROJECT_SHEET_VALUE_DATA_TYPES;
                break;
        }

        for (let i = 0; i < acceptedRecords.length; i++) {
            let possibleOptions;
            if (sheetType == 'projects') {
                possibleOptions = await projectQueries.getProjectFiledOptions();
            }

            const record = acceptedRecords[i];
            let hasError = false;

            for (const key in record) {
                if (record[key] === '-') {
                    continue;
                }

                if (sheetcolumnnameTocolumnname[key] in cellDataTypes) {
                    const dataType = cellDataTypes[sheetcolumnnameTocolumnname[key]];

                    try {
                        if (dataType === 'NUMBER') {
                            // Try to convert to float
                            record[key] = parseFloat(record[key]);
                            if (isNaN(record[key])) throw new Error('Invalid number');
                        } else if (dataType === 'DATE') {
                            const date = new Date((new Date(1899, 11, 31)).getTime() + (record[key] * 86400000));
                            if (isNaN(date.getTime())) throw new Error('Invalid date');

                            // Format the date to 'YYYY-MM-DD'
                            record[key] = date.toISOString().split('T')[0];
                        } else if (dataType === 'OPTIONS') {
                            if (sheetcolumnnameTocolumnname[key] in possibleOptions) {
                                const options = possibleOptions[sheetcolumnnameTocolumnname[key]];
                                let optionAvailable = false;
                                for (const opt of options) {
                                    const databaseOption = opt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                                    const sheetOption = record[key].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

                                    if (databaseOption === sheetOption) {
                                        record[key] = opt;
                                        optionAvailable = true;
                                        break;
                                    }
                                }
                                if (optionAvailable == false) {
                                    highlight[record.rownumber].push(key);
                                    throw new Error('Invalid option');
                                }
                            }
                        }
                    } catch (error) {
                        hasError = true;
                        break; // Stop processing this record and move to the next one
                    }
                }
            }

            if (hasError) {
                rejectedRecords.push(record);
                acceptedRecords.splice(i, 1);
                i--; // Adjust index to account for removed item
            }
        }

        if (sheetType == 'payroll') {

            function isOverlap(startDate1, endDate1, startDate2, endDate2) {
                const start1 = new Date(startDate1);
                const end1 = new Date(endDate1);
                const start2 = new Date(startDate2);
                const end2 = new Date(endDate2);

                return (start1 < end2 && end1 > start2);
            }

            let groupedByEmployee = {};

            let EMPID;
            for (const key in sheetcolumnnameTocolumnname) {
                if (sheetcolumnnameTocolumnname[key] == 'employeeId') {
                    EMPID = key;
                }
            }
            acceptedRecords.forEach(record => {
                const empId = record[EMPID];
                if (!groupedByEmployee[empId]) {
                    groupedByEmployee[empId] = [];
                }
                groupedByEmployee[empId].push(record);
            });

            // Check for overlapping date ranges and move to rejectedRecords
            for (let empId in groupedByEmployee) {
                let records = groupedByEmployee[empId];

                if (records.length > 1) {
                    let overlapFound = false;

                    for (let i = 0; i < records.length; i++) {
                        for (let j = i + 1; j < records.length; j++) {
                            if (isOverlap(records[i]["Start Date"], records[i]["End Date"], records[j]["Start Date"], records[j]["End Date"])) {
                                overlapFound = true;
                                rejectedRecords.push(records[i]);
                                rejectedRecords.push(records[j]);
                                acceptedRecords = acceptedRecords.filter(r => r !== records[i] && r !== records[j]);
                            }
                        }
                    }

                    // If overlap was found, remove from acceptedRecords
                    if (overlapFound) {
                        delete groupedByEmployee[empId];
                    }
                }
            }
        }


        return {
            company,
            sheetData,
            acceptedRecords,
            rejectedRecords,
            sheetcolumnnameTocolumnname,
            emails, ccs, subject, highlight
        };

    } catch (error) {
        console.log("Error processing sheet", error);
    }
}

async function intearctionSheetsProcessor(files, userId) {
    try {
        let platformUser = await PlatformUsers.findOne({ where: { userId: userId } });
        platformUser = platformUser.dataValues;
        const userName = platformUser.firstName + ' ' + (platformUser.middleName || '') + ' ' + platformUser.lastName;
        const email = platformUser.email;

        let acceptedSheets = [];
        let acceptedFiles = [];
        let rejectedSheets = []; 

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const workbook = XLSX.readFile(file.path);

            for (let j = 0; j < workbook.SheetNames.length; j++) {
                const sheetName = workbook.SheetNames[j];
                const sheet = workbook.Sheets[sheetName];

                // Upload file to Azure
                const { url, cloudStatus, cloudMessage } = await uploadSheetToAzure(file);

                // Save file details in MasterSheet
                const masterSheetData = {
                    id: uuidv4(),
                    sheettype: "interactions",
                    sheetname: file.originalname,
                    url: url,
                    createdby: userId,
                    status: cloudStatus || "uploaded",
                    message: cloudMessage || null
                };
                const savedSheet = await MasterSheet.create(masterSheetData);

                if (cloudStatus === 'failed') {
                    rejectedSheets.push({
                        fileName: file.originalname,
                        message: cloudMessage
                    });
                    continue;
                }

                // Validate Interaction ID presence
                let cell = sheet['A1'] ? sheet['A1'].v : null;
                let interactionId = sheet['B1'] ? sheet['B1'].v : null;

                if (!cell || cell !== 'Interaction ID' || !interactionId) {
                    rejectedSheets.push({
                        fileName: file.originalname,
                        message: "Missing Interaction ID in sheet"
                    });
                    continue;
                }

                // Fetch interaction details
                const interaction = await MasterInteractions.findOne({ where: { interactionsid: interactionId } });
                if (!interaction) {
                    rejectedSheets.push({
                        fileName: file.originalname,
                        message: "Interaction ID not found in database"
                    });
                    continue;
                }

                let systemInteractionQuestions = await assessmentQueries.getQuestionsAndAnswers(interaction.dataValues.id);

                // Process Questions and Answers
                const count = systemInteractionQuestions.length;
                let questionsAndAnswers = {};
                let missingQuestions = [];

                for (let questionCount = 0; questionCount < count; questionCount++) {
                    const questionCell = sheet[`A${questionCount + 5}`];
                    const answerCell = sheet[`B${questionCount + 5}`];

                    if (questionCell && answerCell) {
                        const question = questionCell.v;
                        const answer = answerCell.v;
                        questionsAndAnswers[question] = answer;
                    } else {
                        missingQuestions.push(`Missing question at row ${questionCount + 5}`);
                    }
                }

                // Check for missing questions and reject if necessary
                if (missingQuestions.length > 0) {
                    rejectedSheets.push({
                        fileName: file.originalname,
                        message: "Some questions are missing from the sheet",
                        details: missingQuestions
                    });
                    continue;
                }

                let sheetQuestionsAndAnswers = {};
                Object.keys(questionsAndAnswers).forEach(question => {
                    if (question) {
                        sheetQuestionsAndAnswers[question] = questionsAndAnswers[question];
                    }
                });

                let sheetData = {
                    interactionId: interaction.dataValues.id,
                    systemInteractionQuestions: systemInteractionQuestions,
                    sheetQuestionsAndAnswers: sheetQuestionsAndAnswers
                };

                let { data, evaluateMessage, evaluateStatus } = await evaluateInteractionSheet(sheetData);

                await MasterSheet.update(
                    {
                        message: evaluateMessage || null,
                        status: evaluateStatus || null,
                        projectid: evaluateStatus !== 'failed' && data.projectId ? data.projectId : null,
                        interactionid: interactionId
                    },
                    {
                        where: { id: savedSheet.id }
                    }
                );

                if (evaluateStatus === 'failed') {
                    rejectedSheets.push({
                        fileName: file.originalname,
                        message: evaluateMessage
                    });
                    continue;
                }

                data.sheetId = savedSheet.id;
                data.userName = userName;
                data.useremail = email;
                data.fileName = file.originalname;
                data.interactionId = interaction.dataValues.id;
                data.companyId = interaction.dataValues.companyid;
                data.projectId = interaction.dataValues.projectidentifier;
                acceptedSheets.push(data);
            }

            fs.unlinkSync(file.path);
        }

        // Update interaction answers for accepted sheets
        for (const sheet of acceptedSheets) {
            const { status, message } = await assessmentQueries.updateInteractionAnswersFromSheet(sheet);

            await MasterSheet.update(
                {
                    status: status,
                    message: message,
                    projectid: sheet.projectId,
                    companyid: sheet.companyId
                },
                {
                    where: { id: sheet.sheetId }
                }
            );

            if (status === 'failed') {
                rejectedSheets.push({
                    fileName: sheet.fileName,
                    message: evaluateMessage
                });
            } else {
                acceptedFiles.push({
                    fileName: sheet.fileName
                });

                // Trigger AI Summary Generation
                const triggerSummary = axiosRequest(
                    "post",
                    process.env.AI_GENERATE_SUMMARY,
                    {
                        companyId: sheet.companyId,
                        projectId: sheet.projectId
                    }
                );
                console.log(`InteractionId | action:Trigger AI Summary | projectId=${sheet.projectId}`);
            }
        }

        // Send Email Notification
        await sendMailForUploadedSheets(acceptedFiles, rejectedSheets, userName, email);

    } catch (error) {
        console.error("Error Updating InteractionId Answers From Sheet:", error);
    }
};

async function evaluateInteractionSheet(sheetData) {
    try {

        const { interactionId,
            systemInteractionQuestions, sheetQuestionsAndAnswers
        } = sheetData;

        //check interaction status
        const interactionDetails = await assessmentQueries.getInteractionById(interactionId);

        if (!interactionDetails.interactionInformation[0].status == 'RESPONSE RECEIVED') {
            return {
                evaluateMessage: 'Interaction Response Received',
                evaluateStatus: 'failed'
            };
        }

        //match questions from sheet and fill data
        let intearctionData = [];
        for (const key in sheetQuestionsAndAnswers) {
            const sheetQuestion = key;

            let questionFound = false;

            for (const record of systemInteractionQuestions) {
                const systemQuestion = record.question;

                if (sheetQuestion == systemQuestion) {
                    questionFound = true;

                    intearctionData.push({
                        questionId: record.questionId,
                        answer: sheetQuestionsAndAnswers[key]
                    });
                }
            }

            if (!questionFound) {
                return {
                    evaluateMessage: 'Invalid questions / questions not found in sheet',
                    evaluateStatus: 'failed'
                };
            }
        }

        const data = {
            intearctionData: intearctionData
        }

        return { data, evaluateStatus: 'processing' };

    } catch (error) {
        console.log("Error evaluating interaction sheet : ", error);
        return {
            evaluateMessage: 'Sheet Evaluation Failed | Internal Server Error',
            evaluateStatus: 'failed'
        }
    }
}

module.exports = {
    projectsSheetsProcessor,
    surveySheetsProcessor,
    employeeSheetProcessor,
    projectTeamSheetProcessor,
    payrollSheetProcessor,
    intearctionSheetsProcessor,
    evaluateInteractionSheet
}