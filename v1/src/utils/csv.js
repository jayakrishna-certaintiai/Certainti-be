const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const assessmentQueries = require('../queries/assessment.queries');
const surveyQueries = require("../queries/survey.queries");
const fs = require('fs');
const MasterInteractions = require("../models/master-interactions.model");
const Project = require("../models/project.model");
const Company = require("../models/company.model");
const ExcelJS = require('exceljs');
const projectQueries = require("../queries/project.queries");
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { htmlToText } = require('html-to-text');
const contactQueries = require("../queries/contact.queries")

async function createExcelFile(surveyId) {
    try {
        const surveyData = await surveyQueries.getSurveyDetails(surveyId);

        // Data for filename
        const type = "survey";
        const companyName = surveyData.clientName; // Sanitize the company name
        const projectCode = surveyData.projectId;  // Sanitize the project code

        // Define the desired file name
        let desiredFileName = `${type}_${companyName}_${projectCode}.xlsx`; // Adding the .xlsx extension
        desiredFileName = desiredFileName.replace(/[\\/:*?"<>|]/g, "_");

        // Define the destination file path
        const destinationFilePath = 'v1/src/files/' + desiredFileName;

        // Gather data
        const questions = await surveyQueries.getSurveyQuestionsForExcel(surveyId);
        let excelData = [];
        excelData.push(['Question', 'Answer', 'Notes']);
        excelData.push(['Project ID', surveyData.projectId, '']);
        excelData.push(['Project Name', surveyData.projectName, '']);
        excelData.push(['Project Description', surveyData.description, '']);
        excelData.push(['Assessment Year',surveyData.assesmentYear, '']);
        for (const record of questions) {
            excelData.push([record.question, '', record.description]);
        }

        // Create a new workbook and add a worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Survey Data');

        // Add data to the worksheet
        worksheet.addRows(excelData);

        // Set column widths
        worksheet.columns = [
            { width: 92.86 }, // First column
            { width: 50 },  // Second column
            { width: 86 },  // Third column
        ];

        // Apply font style globally to all cells
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.font = {
                    name: 'Mangal Pro', // Set font name
                    size: 10,           // Set font size
                };
            });
        });

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: 'Mangal Pro', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }; // White text
        headerRow.alignment = {
            horizontal: 'center',  // Center-align horizontally
            vertical: 'middle',    // Center-align vertically
        };
        headerRow.eachCell((cell, colNumber) => {
            if (colNumber <= 3) { // Apply background color up to the first 3 cells
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1F4E78' }, // Dark blue background
                };
            }
        });

        // Apply borders to the first 4 rows
        for (let i = 1; i <= 5; i++) {
            const row = worksheet.getRow(i);
            row.eachCell((cell) => {
                // Add borders to each cell
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        }

        // Style and add borders to rows from row 5 onwards
        worksheet.eachRow((row, rowNumber) => {
            row.getCell(1).font = { ...row.getCell(1).font, bold: true };

            // Apply background colors, alignment, and borders for rows starting from row 5
            if (rowNumber >= 6) {
                row.alignment = {
                    horizontal: 'left',  // Align text to the left
                    vertical: 'middle', // Vertically align text to the middle
                    wrapText: true,      // Enable text wrapping
                };

                row.height = 228; // Set row height

                row.eachCell((cell) => {
                    // Add a light gray background
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF3F3F3' }, // Light gray background
                    };

                    // Add borders to each cell
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            }
        });

        // Write the Excel file to the destination path
        await workbook.xlsx.writeFile(destinationFilePath);

        console.log('Excel file created successfully:', destinationFilePath);
        return destinationFilePath;
    } catch (err) {
        console.error('Error while creating the Excel file:', err);
        throw err; // Rethrow the error if needed
    }
}




async function createCSVforSurvey(surveyId) {
    try {

        //get questions and answers
        const questionsAndAnswers = await surveyQueries.getSurveyQuestionAndAnswers(surveyId);
        let data = questionsAndAnswers.map(item => ({
            question: item.question,
            answer: item.answer,
            notes: item.info
        }));

        const surveyData = await surveyQueries.getSurveyDetails(surveyId);
        data.unshift({
            question: "Project Name",
            answer: surveyData.projectName,
            notes: ""
        });
        data.unshift({
            question: "Project ID",
            answer: surveyData.projectId,
            notes: ""
        });


        //data for filename
        const type = "survey";
        const companyName = surveyData.clientName;
        const projectCode = surveyData.projectId;

        let fileName = `${type}_${companyName}_${projectCode}`;
        fileName = fileName.replace(/[\\/:*?"<>|]/g, "_");

        const filePath = `v1/src/files/${fileName}.xls`;

        fs.writeFile(filePath, '', (err) => {
            if (err) {
                console.error('Error creating the file:', err);
            } else {
                console.log('Survey File is created successfully!');
            }
        });

        const csvWriter = createCsvWriter({
            path: filePath,
            header: [
                { id: 'question', title: 'Question' },
                { id: 'answer', title: 'Answer' },
                { id: 'notes', title: 'Notes' }
            ]
        });

        await csvWriter.writeRecords(data);

        return filePath;

    } catch (error) {
        console.log("Error while creating a file", error);
        throw error;
    }
}

async function createCSVforInteraction(interactionId) {

    try {

        // Get questions and answers
        const questionsAndAnswers = await assessmentQueries.getQuestionsAndAnswers(interactionId);

        // Fetch interaction details
        const interaction = await MasterInteractions.findOne({ where: { id: interactionId } });
        const project = await Project.findOne({ where: { projectIdentifier: interaction.dataValues.projectidentifier } });
        const company = await Company.findOne({ where: { companyId: interaction.dataValues.companyid } });

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Interaction');

        // Set column widths
        worksheet.columns = [
            { width: 200 }, // Column A
            { width: 150 }  // Column B
        ];

        // Add data to the worksheet
        worksheet.addRow(['Interaction ID', interaction.dataValues.interactionsid]);
        worksheet.addRow(['Project ID', project.dataValues.projectCode]);
        worksheet.addRow(['Project Name', project.dataValues.projectName]);
        worksheet.addRow(['Questions', 'Answers']); // Header row for Q&A
        questionsAndAnswers.forEach(item => { worksheet.addRow([item.question, item.answer]); });

        // Apply bold styling to specific cells
        const boldCells = ['A1', 'A2', 'A3', 'A4', 'B4'];
        boldCells.forEach(cellAddress => {
            const cell = worksheet.getCell(cellAddress);
            cell.font = { bold: true };
            // Explicitly set alignment to left and vertical center for bold cells
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
        });

        // Set row heights for rows after row 4
        const totalRows = worksheet.rowCount;
        for (let i = 5; i <= totalRows; i++) {
            worksheet.getRow(i).height = 60; // Set height for rows after row 4
        }

        // Vertically center and left-align all cells in the sheet
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                cell.alignment = { horizontal: 'left', vertical: 'middle' }; // Left align horizontally and center vertically
            });
        });

        // Prepare the file path
        const type = 'interaction';
        const companyName = company.dataValues.companyName;
        const projectCode = project.dataValues.projectCode;
        let fileName = `${type}_${companyName}_${projectCode}`.replace(/[\\/:*?"<>|]/g, "_");
        const filePath = `v1/src/files/${fileName}.xlsx`;

        // Write the workbook to a file
        await workbook.xlsx.writeFile(filePath);

        console.log('Interaction Excel file created successfully:', filePath);

        return filePath;
    } catch (error) {

        console.error("Error while creating the Excel file:", error);

        throw error;

    }

}


async function reportForProjects(companyIds) {
    try {
        // Fetch the report data
        const data = await projectQueries.getProjectsReport(companyIds);

        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Projects');

        // Define columns (headers)
        const columns = Object.keys(data[0]).map((key) => ({
            header: key, // Column header is the key from the data
            key: key, // Column key (matches data key)
            width: Math.max(...data.map(item => (item[key] || '').toString().length), key.length) + 2 // Set column width
        }));

        // Set the columns in the worksheet
        worksheet.columns = columns;

        // Add rows to the worksheet
        data.forEach((item, index) => {
            const row = worksheet.addRow(item);

            // Apply alternating row colors
            if (index % 2 === 0) {
                row.eachCell((cell) => {
                    cell.style = {
                        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } }, // Light grey for even rows
                        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                    };
                });
            } else {
                row.eachCell((cell) => {
                    cell.style = {
                        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }, // White for odd rows
                        border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                    };
                });
            }
        });

        // Make the first row (header row) bold with background color
        const headerRow = worksheet.getRow(1); // Get the first row
        headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }; // Bold and white text
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align header
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } }; // Blue background for header

        // Set border for the entire table (optional)
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Save the Excel file
        const filePath = 'v1/src/files/ProjectReport.xlsx';
        await workbook.xlsx.writeFile(filePath);

        // Return the file path
        return filePath;
    } catch (error) {
        console.log("Error while creating a file for project report", error);
        throw error;
    }
}

async function generateSummaryReport(data, filePath, format) {
    try {
        const plainText = htmlToText(data, {
            wordwrap: 130,
            preserveNewlines: true,
            ignoreHref: true,
            ignoreImage: true
        });

        if (format === 'pdf') {
            // PDF generation logic
            await new Promise((resolve, reject) => {
                const doc = new PDFDocument();
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);
                doc.fontSize(18).text(`Technical Summaries Report`, { align: 'center' });
                doc.moveDown();
                doc.fontSize(14).text(plainText);
                doc.end();

                stream.on('finish', resolve);
                doc.on('error', reject);
                stream.on('error', reject);
            });
            return filePath;
        } else if (format === 'docx') {
            // Word document generation logic
            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: [
                            new Paragraph({
                                text: `Technical Summaries Report`,
                                heading: "Heading1",
                                alignment: "center",
                                spacing: {
                                    after: 100, // Space after the title
                                }
                            }),
                            ...plainText.split('\n').map((line) =>
                                new Paragraph({
                                    text: line,
                                    alignment: "left",
                                    spacing: {
                                        after: 10, // Add space after each line
                                    },
                                    style: {
                                        font: "Times New Roman", // Match PDF font style
                                        size: 24, // Equivalent to PDF font size 12pt
                                    }
                                })
                            ),
                        ]
                    }
                ]
            });

            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);
            return filePath;
        }
    } catch (error) {
        console.error("Error generating report:", error);
        throw error;
    }
}

async function reportForTechnicalSummaries(technicalSummaryIds, format) {
    const summaries = await projectQueries.getTechnicalSummaries(technicalSummaryIds);
    const filePaths = [];

    for (const summary of summaries) {
        const filePath = `v1/src/files/TechnicalSummary_${summary.companyName + "_" + summary.projectCode}.${format}`;
        await generateSummaryReport(summary.summary, filePath, format);
        filePaths.push(filePath);
    }

    return filePaths;
}

async function generateInteractionsReport(interactions, filePath, format) {
    try {
        if (format === 'pdf') {
            // PDF generation logic
            await new Promise((resolve, reject) => {
                const doc = new PDFDocument();
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);
                doc.fontSize(18).text(`Interaction Report`, { align: 'center' });

                for (let i = 0; i < interactions.length; i++) {
                    if (i > 0) doc.addPage(); // Add a new page for each interaction
                    const formattedText = `${htmlToText(interactions[i], {
                        wordwrap: 130,
                        preserveNewlines: true,
                        ignoreHref: true,
                        ignoreImage: true,
                    })}`;
                    doc.moveDown();
                    doc.fontSize(14).text(formattedText);
                }

                doc.end();

                stream.on('finish', resolve);
                doc.on('error', reject);
                stream.on('error', reject);
            });
            return filePath;
        } else if (format === 'docx') {
            // Word document generation logic
            const sections = interactions.map((interaction, index) => {
                const formattedText = `${htmlToText(interaction, {
                    wordwrap: 130,
                    preserveNewlines: true,
                    ignoreHref: true,
                    ignoreImage: true,
                })}`;

                return {
                    properties: index > 0 ? { pageBreakBefore: true } : {},
                    children: [
                        new Paragraph({
                            text: `Interaction Report`,
                            heading: "Heading1",
                            alignment: "center",
                            spacing: {
                                after: 100,
                            }
                        }),
                        ...formattedText.split('\n').map((line) =>
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: line,
                                        font: "Times New Roman",
                                        size: 24, // 12pt equivalent
                                    }),
                                ],
                                alignment: "left",
                                spacing: {
                                    after: 10,
                                },
                            })
                        ),
                    ]
                };
            });

            const doc = new Document({ sections });
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);
            return filePath;
        }
    } catch (error) {
        console.error("Error generating report:", error);
        throw error;
    }
}


async function reportForInteractions(interactionsIds, format) {
    const filePaths = [];
    const interactionHtmlArray = [];

    try {
        for (const interactionsId of interactionsIds) {
            const interaction = await projectQueries.getInteractions(interactionsId);
            const interactioninfo = await assessmentQueries.getInteractionById(interactionsId)

            let interactionhtml = `
                Account Name: ${interaction[0].companyName}<br>
                Project Name: ${interactioninfo.interactionInformation[0].projectName}<br>
                Project Id: ${interactioninfo.interactionInformation[0].projectCode}<br> 
                Status : ${interactioninfo.interactionInformation[0].status}<br>
                Sent To : ${interactioninfo.interactionInformation[0].sentTo ? interactioninfo.interactionInformation[0].sentTo : ' '}<br>
                Sent Date : ${interactioninfo.interactionInformation[0].sentDate ? new Date(interactioninfo.interactionInformation[0].sentDate).toISOString().slice(0, 19).replace("T", " ") : ' '}<br>
                Responded Date : ${interactioninfo.interactionInformation[0].responseDate ? new Date(interactioninfo.interactionInformation[0].responseDate).toISOString().slice(0, 19).replace("T", " ") : ' '}<br>
            `;
            let questionNumber = 1;

            for (const record of interaction) {
                interactionhtml += `<br>Q${questionNumber}: ${record.question}<br>Answer: ${record.answer ? record.answer : 'No answer'}<br><br>`;
                questionNumber++;  // Increment question number for each question
            }

            interactionHtmlArray.push(interactionhtml);
        }
        const filePath = `v1/src/files/Interactions_Response.${format}`;
        await generateInteractionsReport(interactionHtmlArray, filePath, format);
        return [filePath];

    } catch (error) {
        console.error("Error generating interaction reports:", error);
        throw error;  // Re-throw the error after logging it, to ensure it's properly handled by the caller
    }

    return filePaths;
}

async function reportForEmployeeSheet() {
    try {
        // Fetch employee data to determine the column headers
        const data = await contactQueries.fetchEmployeeData();

        if (!data || data.length === 0) {
            throw new Error('No data available to determine column headers.');
        }

        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employees');

        // Define columns (headers)
        const allKeys = new Set(data.flatMap(Object.keys));

        const columns = Array.from(allKeys).map((key) => ({
            header: key, // Column header is the key from the data
            key: key, // Column key (matches data key)
            width: key.length + 2 // Set column width based on key length
        }));


        // Set the columns in the worksheet
        worksheet.columns = columns;

        // Style the header row
        const lastKey = Object.keys(data[data.length - 1]).pop();
        const stateColumnIndex = columns.findIndex(col => col.key === lastKey) + 1;

        if (stateColumnIndex === 0) {
            throw new Error("Column 'lastKey' not found in the data.");
        }

        // Style the header row only up to the "state" column
        const headerRow = worksheet.getRow(1); // Get the first row
        for (let i = 1; i <= stateColumnIndex; i++) { // Apply styles only up to 'state' column
            const cell = headerRow.getCell(i);
            cell.font = { bold: true, color: { argb: 'FFFFFF' } }; // Bold and white text
            cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align header
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } }; // Blue background
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }


        // Set border for the header row
        headerRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Save the Excel file
        const filePath = 'v1/src/files/EmployeeReport.xlsx';
        await workbook.xlsx.writeFile(filePath);

        // Return the file path
        return filePath;
    } catch (error) {
        console.log("Error while creating a file for project report", error);
        throw error;
    }
};

async function reportForEmployeeWagesSheet() {
    try {
        // Fetch wage data to determine the column headers
        const data = await contactQueries.fetchEmployeeWagesData();

        if (!data || data.length === 0) {
            throw new Error('No data available to determine column headers.');
        }

        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employee Wages');

        const allKeys = new Set(data.flatMap(Object.keys));

        const columns = Array.from(allKeys).map((key) => ({
            header: key, // Column header is the key from the data
            key: key, // Column key (matches data key)
            width: key.length + 2 // Set column width based on key length
        }));

        // Set the columns in the worksheet
        worksheet.columns = columns;

        // Style the header row
        const lastKey = Object.keys(data[data.length - 1]).pop();
        const stateColumnIndex = columns.findIndex(col => col.key === lastKey) + 1;

        if (stateColumnIndex === 0) {
            throw new Error("Column 'lastKey' not found in the data.");
        }

        // Style the header row only up to the "state" column
        const headerRow = worksheet.getRow(1); // Get the first row
        for (let i = 1; i <= stateColumnIndex; i++) { // Apply styles only up to 'state' column
            const cell = headerRow.getCell(i);
            cell.font = { bold: true, color: { argb: 'FFFFFF' } }; // Bold and white text
            cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align header
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } }; // Blue background
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        }

        // Save the Excel file
        const filePath = 'v1/src/files/EmployeeWagesReport.xlsx';
        await workbook.xlsx.writeFile(filePath);

        // Return the file path
        return filePath;
    } catch (error) {
        console.error("Error while creating a file for wages report", error);
        throw error;
    }
}


async function reportForTeamMemberSheet() {
    try {
        // Mapping of data keys to column headers
        const columnMapping = {
            employeeid: "Employee ID",
            employementType: "Type",
            employeeTitle: "Designation",
            firstName: "Name",
            email: "Email",
            phone: "Phone",
            Address: "Address",
            Language: "Language",
            status: "Status",
            city: "City",
            state: "State",
            projectCode: "Project ID",
            projectRole: "Project Role",
            s_total_cost: "Total Cost"
        };

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Team Members");

        // Define columns using the mapping
        const columns = Object.keys(columnMapping).map((key) => ({
            header: columnMapping[key],
            key: key,
            width: columnMapping[key].length + 5 // Adjust column width
        }));

        // Set the columns in the worksheet
        worksheet.columns = columns;

        // Header color
        const headerColor = "4F81BD"; // Blue background

        // Style the header row
        const headerRow = worksheet.getRow(1);

        headerRow.eachCell((cell, colNumber) => {
            if (colNumber <= 14) { // Apply styling to only the first 14 headers
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: headerColor } // Uniform color for all headers
                };
                cell.font = { bold: true, color: { argb: "FFFFFF" } }; // White font for contrast
                cell.alignment = { horizontal: "center", vertical: "middle" };
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };
            }
        });

        // Save the Excel file
        const filePath = "v1/src/files/TeamMembersReport.xlsx";
        await workbook.xlsx.writeFile(filePath);

        // Return the file path
        return filePath;
    } catch (error) {
        console.error("Error while creating a file for team members report:", error);
        throw error;
    }
}

async function generateSurveysReport(surveys, filePath, format) {
    try {
        if (format === 'pdf') {
            // PDF generation logic
            await new Promise((resolve, reject) => {
                const doc = new PDFDocument();
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);
                doc.fontSize(18).text(`Survey Report`, { align: 'center' });

                for (let i = 0; i < surveys.length; i++) {
                    if (i > 0) doc.addPage(); // Add a new page for each surveys
                    const formattedText = `${htmlToText(surveys[i], {
                        wordwrap: 130,
                        preserveNewlines: true,
                        ignoreHref: true,
                        ignoreImage: true,
                    })}`;
                    doc.moveDown();
                    doc.fontSize(14).text(formattedText);
                }

                doc.end();

                stream.on('finish', resolve);
                doc.on('error', reject);
                stream.on('error', reject);
            });
            return filePath;
        } else if (format === 'docx') {
            // Word document generation logic
            const sections = surveys.map((survey, index) => {
                const formattedText = `${htmlToText(survey, {
                    wordwrap: 130,
                    preserveNewlines: true,
                    ignoreHref: true,
                    ignoreImage: true,
                })}`;

                return {
                    properties: index > 0 ? { pageBreakBefore: true } : {},
                    children: [
                        new Paragraph({
                            text: `surveys Report`,
                            heading: "Heading1",
                            alignment: "left",
                            spacing: {
                                after: 500,
                            }
                        }),
                        ...formattedText.split('\n').map((line) =>
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: line,
                                        font: "Times New Roman",
                                        size: 14, // 12pt equivalent
                                    }),
                                ],
                                alignment: "left",
                                spacing: {
                                    after: 18,
                                },
                            })
                        ),
                    ]
                };
            });

            const doc = new Document({ sections });
            const buffer = await Packer.toBuffer(doc);
            fs.writeFileSync(filePath, buffer);
            return filePath;
        }
    } catch (error) {
        console.error("Error generating report:", error);
        throw error;
    }
}
const objectToDocument = async (surveyDetails, format) => {
    const surveyHtmlArray = [];

    try {
        for (let surveyDatas of surveyDetails) {
            const survey = surveyDatas.surveyDetail;
            const questionAndAnswers = surveyDatas.questionAndAnswers;
            // Initialize the HTML structure for survey details
            let surveyhtml = `
                Project Name: ${survey.projectName || 'N/A'}<br>
                Project Id: ${survey.projectIdentifier || 'N/A'}<br>
                Status: ${survey.status || 'N/A'}<br>
                Sent To: ${survey.sentTo || 'N/A'}<br>
                Sent Date: ${survey.sendOn ? new Date(survey.sendOn).toISOString().slice(0, 19).replace("T", " ") : 'N/A'}<br>
                Responded Date: ${survey.responseDate ? new Date(survey.responseDate).toISOString().slice(0, 19).replace("T", " ") : 'N/A'}<br>
            `;

            let questionNumber = 1;

            questionAndAnswers.forEach((qa, index) => {
                // Add Question to the HTML
                surveyhtml += `
                    Q${questionNumber}: ${qa.question}<br>
                    Answer: ${qa.answer || 'No answer'}<br>
                `;
                questionNumber++;
            });

            // Push the generated HTML for this survey to the array
            surveyHtmlArray.push(surveyhtml);
        }

        // Define the file path where the report will be saved
        const filePath = `v1/src/files/Survey_Report.${format}`;

        // Call the function that generates the report (ensure this function is defined)
        await generateSurveysReport(surveyHtmlArray, filePath, format);

        return filePath;
    } catch (error) {
        console.error("Error generating document:", error.stack);
        throw error;
    }
};





async function projectSampleSheet() {
    try {
        const columns = {
            "Project ID": null,
            "Project Name": null,
            "Project Cost - FTE": null,
            "Project Cost - Subcon": null,
            "Project Cost - Total": null,
            "QRE(%) - Adjustment": null,
            "SPOC Name": null,
            "SPOC Email": null,
            "Project Status": null,
            "Project Hours - FTE": null,
            "Project Hours - Subcon": null,
            "Project Hours - Total": null,
            "QRE - FTE": null,
            "QRE - Subcon": null,
            "QRE - Total": null,
            "R&D Credits": null,
            "Data Gathering": null,
            "Pending Data": null,
            "Timesheet Status": null,
            "Cost Status - Employee": null,
            "Cost Status - Subcon": null,
            "Interaction - Status": null,
            "Technical Interview Status": null,
            "Technical Summary Status": null,
            "Financial Summary Status": null,
            "Claims Form Status": null,
            "Final Review Status": null,
            "Notes": null,
            "Description": null,
            "Old SPOC Name": null,
            "Old SPOC Email": null,
            "R&D Status": null,
            "Project Type": null,
            "Start Date": null,
            "End Date": null,
            "Planned Duration": null,
            "Actual Start Date": null,
            "Actual End Date": null,
            "Actual Duration": null,
            "Project Industry": null,
            "Nature Of Project": null,
            "Success Criteria": null,
            "Tech Stack": null,
            "Project Manager": null,
            "Technical Contact": null
        };

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Projects');

        // Add headers to the first row
        const headers = Object.keys(columns);
        const headerRow = worksheet.addRow(headers);

        // Style the header row
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '0070C0' }, // Light blue
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });

        // Auto-adjust column widths
        headers.forEach((header, index) => {
            const column = worksheet.getColumn(index + 1);
            column.width = Math.max(header.length + 5, 20); // Set a minimum width of 20
        });

        // Add alternating row colors for better readability
        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex > 1) { // Skip the header row
                const fillColor = rowIndex % 2 === 0 ? 'F2F2F2' : 'FFFFFF'; // Light gray and white
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: fillColor },
                    };
                });
            }
        });

        // Define file path
        const filePath = 'v1/src/files/ProjectSampleSheet.xlsx';

        // Write to file
        await workbook.xlsx.writeFile(filePath);

        console.log(`Excel file created at: ${filePath}`);
        return filePath;
    } catch (error) {
        console.error("Error while creating a file for the project sample sheet:", error);
        throw error;
    }
}

module.exports = {
    createCSVforSurvey,
    createCSVforInteraction,
    createExcelFile,
    reportForProjects,
    reportForTechnicalSummaries,
    reportForInteractions,
    reportForEmployeeSheet,
    reportForEmployeeWagesSheet,
    reportForTeamMemberSheet,
    objectToDocument,
    projectSampleSheet
}