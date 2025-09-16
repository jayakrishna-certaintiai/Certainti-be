const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const contacts = require("../queries/contact.queries");
const authQueries = require("../queries/auth.queries");
const updateSpoc = require("../utils/updateSpoc");
const { uploadFileToAzureStorage } = require('../utils/azureBlobStorage');
const contactQueries = require("../queries/contact.queries");
const fileToDatabse = require("../utils/fileToDatabase");
const MasterSheet = require("../models/master-sheets.model");
const { v4: uuidv4 } = require("uuid");
const TeamMembers = require("../models/teammembers.model");
const Contacts = require("../models/contact.model");
const { reportForEmployeeSheet, reportForEmployeeWagesSheet, reportForTeamMemberSheet } = require("../utils/csv")
const fs = require('fs');

const getContactFilterValues = async (req, res) => {
    try {

        const { companyId } = req.query;

        const filter = { companyId };

        const data = await contactQueries.getContactFilterValues(filter);

        return res.status(200).json(new ApiResponse(data, "Contacts filters values fetched successfully.", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getContactFilterValuesList = async (req, res) => {
    try {

        const filter = {
            caseId: req.query.caseId ? req.query.caseId : null,
            projectId: req.query.projectId ? req.query.projectId : null
        };

        const data = await contactQueries.getContactFilterValuesList(filter);

        return res.status(200).json(new ApiResponse(data, "Contacts filters values fetched successfully.", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getContacts = async (req, res) => {
    try {

        const filter = {
            employeeIds: req.query.employeeIds ? JSON.parse(req.query.employeeIds.replace(/'/g, '"')) : null,
            employeeNames: req.query.employeeNames ? JSON.parse(req.query.employeeNames.replace(/'/g, '"')) : null,
            employeeTitles: req.query.employeeTitles ? JSON.parse(req.query.employeeTitles.replace(/'/g, '"')) : null,
            employementTypes: req.query.employementTypes ? JSON.parse(req.query.employementTypes.replace(/'/g, '"')) : null,
            emails: req.query.emails ? JSON.parse(req.query.emails.replace(/'/g, '"')) : null,
            companyIds: req.query.companyIds ? JSON.parse(req.query.companyIds.replace(/'/g, '"')) : null,
        }

        const sort = {
            sortField: req.query.sortField,
            sortOrder: req.query.sortOrder
        };

        const data = await contacts.getContactsList(filter, sort);
        return res
            .status(200)
            .json(new ApiResponse(data, "Contacts fetched successfully."));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getContactById = async (req, res) => {
    try {
        const data = await contacts.getContactDetails(req.params.contact);
        return res
            .status(200)
            .json(new ApiResponse(data, "Contacts fetched successfully."));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const createContact = async (req, res) => {
    try {
        const { firstName, lastName, email, company, title, phone } = req.body;
        const { user } = req.params;

        const userDetails = await authQueries.getUserProfile(user)
        const userName = userDetails.firstName
        req.body.createdBy = userName;
        req.body.modifiedBy = userName;
        if (
            [firstName, lastName, email, company, title, phone].some((field) => field?.trim() === "")
        ) {
            return res
                .status(422)
                .json(new ApiError("Fill all required fields.", 422));
        }

        const existedUser = await contacts.getExistingContact({
            email
        });

        if (existedUser) {
            return res
                .status(422)
                .json(new ApiError("User with same email already exists.", 422));
        }

        const newContact = await contacts.createNewContact(req.body);

        if (!newContact) {
            return res
                .status(422)
                .json(new ApiError("Something went wrong while creating a new contact.", 422));
        }

        return res
            .status(201)
            .json(new ApiResponse(newContact, "Contact created Successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const updateContact = async (req, res) => {
    try {
        const user = req.params.user
        const userDetails = await authQueries.getUserProfile(user)
        const userName = userDetails.firstName
        req.body.modifiedBy = userName
        const contactId = req.params.contact;
        const existedUser = await contacts.getExistingContact({
            contactId
        });

        if (!existedUser) {
            return res.status(422).json(
                new ApiError("Invalid contact id.", 422)
            );
        }

        const uContact = await contacts.updateExistingContact(req.body, { contactId })

        if (Array.isArray(uContact)) {
            return res.status(200).json(
                new ApiResponse(uContact, "Contact updated successfully.")
            );
        } else {
            return res.status(400).json(
                new ApiError("Error in updating contact.", 400)
            );
        }

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getProjectsByContact = async (req, res) => {
    try {

        const filter = {
            projectCodes: req.query.projectCodes ? JSON.parse(req.query.projectCodes.replace(/'/g, '"')) : null,
            projectNames: req.query.projectNames ? JSON.parse(req.query.projectNames.replace(/'/g, '"')) : null,
            projectRoles: req.query.projectRoles ? JSON.parse(req.query.projectRoles.replace(/'/g, '"')) : null,
            employeeTitles: req.query.employeeTitles ? JSON.parse(req.query.employeeTitles.replace(/'/g, '"')) : null
        };

        const sort = {
            sortField: req.query.sortField,
            sortOrder: req.query.sortOrder
        };

        const data = await contacts.getProjectsByContactId(req.params.contact, filter, sort);
        return res
            .status(200)
            .json(new ApiResponse(data, "Contacts fetched successfully."));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getSalaryByContact = async (req, res) => {
    try {

        const filter = {
            minAnnualSalary: req.query.minAnnualSalary,
            maxAnnualSalary: req.query.maxAnnualSalary,
            minHourlyRate: req.query.minHourlyRate,
            maxHourlyRate: req.query.maxHourlyRate,
            minStartDate: req.query.minStartDate,
            maxStartDate: req.query.maxStartDate,
            minEndDate: req.query.minEndDate,
            maxEndDate: req.query.maxEndDate
        };

        const sort = {
            sortField: req.query.sortField,
            sortOrder: req.query.sortOrder
        };

        const data = await contacts.getContactSalary(req.params.contact, sort, filter);
        return res
            .status(200)
            .json(new ApiResponse(data, "Contact salary fetched successfully."));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const getRnDExpenseByContact = async (req, res) => {
    try {

        const filter = {
            projectCodes: req.query.projectCodes ? JSON.parse(req.query.projectCodes.replace(/'/g, '"')) : null,
            projectNames: req.query.projectNames ? JSON.parse(req.query.projectNames.replace(/'/g, '"')) : null,
            minTotalHours: req.query.minTotalHours,
            maxTotalHours: req.query.maxTotalHours,
            minHourlyRate: req.query.minHourlyRate,
            maxHourlyRate: req.query.maxHourlyRate,
            minRnDExpense: req.query.minRnDExpense,
            maxRnDExpense: req.query.maxRnDExpense
        }

        const sort = {
            sortField: req.query.sortField,
            sortOrder: req.query.sortOrder
        };

        const data = await contacts.getRnDExpenseTable(req.params.contact, sort, filter);

        return res
            .status(200)
            .json(new ApiResponse(data, "Contact rnd fetched successfully."));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const updateSpocDetails = async (req, res) => {
    try {
        const { purpose } = req.body;

        if (!purpose || purpose == null) {
            return res.status(400).json(new ApiResponse(null, "Purpose is missing", false));
        }

        const ids = req.body.ids;
        if (!ids || ids.length == 0) {
            return res.status(400).json(new ApiResponse(null, "Purpose is missing", false));
        }

        const { spocName, spocEmail } = req.body;
        if (!spocName || !spocEmail || spocName == null || spocEmail == null) {
            return res.status(400).json(new ApiResponse(null, "Spoc details missing", false));
        }

        switch (purpose) {
            case 'PROJECT':
                await updateSpoc.updateProjectSpoc(ids, spocName, spocEmail);
                break;
            case 'INTERACTION':
                await updateSpoc.updateInteractionSpoc(ids, spocName, spocEmail);
                break;
            case 'SURVEY':
                await updateSpoc.updateSurveySpoc(ids, spocName, spocEmail);
                break;
        }

        return res.status(200).json(new ApiResponse(null, "Spoc details updated successfully", true));

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}


const getTeamMembers = async (req, res) => {
    try {
        const { companyId, sortField, sortOrder } = req.query;

        const sort = {
            sortField,
            sortOrder
        };

        const filters = {
            teamMemberIds: req.query.teamMemberIds ? JSON.parse(req.query.teamMemberIds.replace(/'/g, '"')) : null,
            employeeIds: req.query.employeeIds ? JSON.parse(req.query.employeeIds.replace(/'/g, '"')) : null,
            companyIds: req.query.companyIds ? JSON.parse(req.query.companyIds.replace(/'/g, '"')) : null,
            names: req.query.names ? JSON.parse(req.query.names.replace(/'/g, '"')) : null,
            employementTypes: req.query.employementTypes ? JSON.parse(req.query.employementTypes.replace(/'/g, '"')) : null,
            employeeTitles: req.query.employeeTitles ? JSON.parse(req.query.employeeTitles.replace(/'/g, '"')) : null,
            companyNames: req.query.companyNames ? JSON.parse(req.query.companyNames.replace(/'/g, '"')) : null,
            projectIds: req.query.projectIds ? JSON.parse(req.query.projectIds.replace(/'/g, '"')) : null,
            projectCodes: req.query.projectCodes ? JSON.parse(req.query.projectCodes.replace(/'/g, '"')) : null,
            projectNames: req.query.projectNames ? JSON.parse(req.query.projectNames.replace(/'/g, '"')) : null,
            hourlyRates: req.query.hourlyRates ? JSON.parse(req.query.hourlyRates.replace(/'/g, '"')) : null,
            totalHourses: req.query.totalHourses ? JSON.parse(req.query.totalHourses.replace(/'/g, '"')) : null,
            totalCosts: req.query.totalCosts ? JSON.parse(req.query.totalCosts.replace(/'/g, '"')) : null,
            rndCreditses: req.query.rndCreditses ? JSON.parse(req.query.rndCreditses.replace(/'/g, '"')) : null,
            qreCosts: req.query.qreCosts ? JSON.parse(req.query.qreCosts.replace(/'/g, '"')) : null,
            rndPotentials: req.query.rndPotentials ? JSON.parse(req.query.rndPotentials.replace(/'/g, '"')) : null
        }

        const others = {
            caseId: req.query.caseId ? req.query.caseId : null
        }

        const teamMembers = await contacts.getAllTeamMembers(sort, filters, others);
        res.status(200).json(teamMembers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getContactFieldOptions = async (req, res) => {
    try {
        const employementTypes = ["FTE", "Subcon"];
        const data = {
            employementTypes
        }
        return res.status(200).json(new ApiResponse(data, "Contact options fetched successfully", true));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


const updateTeamMember = async (req, res) => {
    try {

        let editFields = req.body.editFields;

        // Convert project IDs to remove any extra quotes around them
        let cleanedEditFields = {};
        for (let teammemberId in editFields) {
            const cleanProjectId = teammemberId.replace(/['"]+/g, '');
            cleanedEditFields[cleanProjectId] = editFields[teammemberId];
        }

        // Update each project with the new details
        for (let teammemberId in cleanedEditFields) {

            cleanedEditFields[teammemberId].teammemberId = teammemberId;

            const teamMember = await TeamMembers.findOne({ where: { teamMemberId: teammemberId } });

            if (teamMember) {
                const contactData = {
                    employementType: cleanedEditFields[teammemberId].employementType,
                    employeeTitle: cleanedEditFields[teammemberId].employeeTitle
                }

                const teammemberData = {
                    totalHours: cleanedEditFields[teammemberId].totalHours,
                    s_total_cost: cleanedEditFields[teammemberId].totalCost,
                    rndCredits: cleanedEditFields[teammemberId].rndCredits,
                    qreCost: cleanedEditFields[teammemberId].qreCost
                }

                // Function to remove keys with null values
                const removeNullKeys = (obj) => {
                    Object.keys(obj).forEach(key => {
                        if (obj[key] === undefined) {
                            delete obj[key];
                        }
                    });
                };

                // Remove null keys from both objects
                removeNullKeys(contactData);
                removeNullKeys(teammemberData);

                if (Object.keys(contactData).length > 0) await Contacts.update(contactData, { where: { contactId: teamMember.dataValues.contactId } });
                if (Object.keys(teammemberData).length > 0) await TeamMembers.update(teammemberData, { where: { teamMemberId: teammemberId } });
            }
        }

        return res.status(200).json(new ApiResponse(null, "Team Member updated successfully", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}


const uploadEmployeeSheet = async (req, res) => {
    try {
        const { companyId, userId } = req.params;

        //check file
        const file = req.file;
        if (!file) {
            return res.status(400).json(new ApiResponse("File not found.", false));
        }

        //upload to azure
        const employeeSheet = await uploadFileToAzureStorage(file);

        //make an entry for project sheet in master-sheet
        const masterSheetData = {
            id: uuidv4(),
            sheettype: "employees",
            sheetname: file.originalname,
            status: 'uploaded',
            url: employeeSheet.url,
            companyid: companyId,
            createdby: userId
        };
        const savedProjectSheet = await MasterSheet.create(masterSheetData);

        fileToDatabse.employeeSheetProcessor(userId, companyId, savedProjectSheet.dataValues.id, file);

        return res.status(200).json(new ApiResponse(null, "Employee sheet uploaded successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const uploadProjectTeamSheet = async (req, res) => {
    try {
        const { companyId, userId } = req.params;

        //check file
        const file = req.file;
        if (!file) {
            return res.status(400).json(new ApiResponse("File not found.", false));
        }

        //upload to azure
        const projectTeamSheet = await uploadFileToAzureStorage(file);

        //make an entry for project sheet in master-sheet
        const masterSheetData = {
            id: uuidv4(),
            sheettype: "project team",
            sheetname: file.originalname,
            status: 'uploaded',
            url: projectTeamSheet.url,
            companyid: companyId,
            createdby: userId
        };
        const savedProjectSheet = await MasterSheet.create(masterSheetData);

        fileToDatabse.projectTeamSheetProcessor(userId, companyId, savedProjectSheet.dataValues.id, file);

        return res.status(200).json(new ApiResponse(null, "Project Team sheet uploaded successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));

    }
};

const uploadPayrollSheet = async (req, res) => {
    try {

        const { companyId, userId } = req.params;

        //check file
        const file = req.file;
        if (!file) {
            return res.status(400).json(new ApiResponse("File not found.", false));
        }

        //upload to azure
        const payrollSheet = await uploadFileToAzureStorage(file);

        //make an entry for project sheet in master-sheet
        const masterSheetData = {
            id: uuidv4(),
            sheettype: "payroll",
            sheetname: file.originalname,
            status: 'uploaded',
            url: payrollSheet.url,
            companyid: companyId,
            createdby: userId
        };
        const savedProjectSheet = await MasterSheet.create(masterSheetData);

        fileToDatabse.payrollSheetProcessor(userId, companyId, savedProjectSheet.dataValues.id, file);

        return res.status(200).json(new ApiResponse(null, "Project Team sheet uploaded successfully.", true));
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getEmployeeSheet = async (req, res) => {
    try {

        // Generate the file and get its path
        const filePath = await reportForEmployeeSheet();

        // Set headers for Excel file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="EmployeeSheet.xlsx"');

        // Read the file and pipe it to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up the file after download (optional)
        fileStream.on('end', () => {
            fs.unlink(filePath, (err) => {
                if (err) console.error("Failed to delete temporary file:", err);
            });
        });

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

const getEmployeeWagesSheet = async (req, res) => {
    try {


        // Generate the file and get its path
        const filePath = await reportForEmployeeWagesSheet();

        // Set headers for Excel file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="EmployeeWagesSheet.xlsx"');

        // Read the file and pipe it to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up the file after download
        fileStream.on('end', () => {
            fs.unlink(filePath, (err) => {
                if (err) console.error("Failed to delete temporary file:", err);
            });
        });

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};
const getTeamMemberReport = async (req, res) => {
    try {
        // Generate the file and get its path
        const filePath = await reportForTeamMemberSheet();

        // Set headers for Excel file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="TeamMembersSheet.xlsx"');
        res.setHeader('X-Success-Message', 'The Team Members sheet has been successfully downloaded!');

        // Read the file and pipe it to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Clean up the file after download
        fileStream.on('end', () => {
            fs.unlink(filePath, (err) => {
                if (err) console.error("Failed to delete temporary file:", err);
            });
        });

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

module.exports = {
    getContacts,
    createContact,
    updateContact,
    getContactById,
    getProjectsByContact,
    getSalaryByContact,
    getRnDExpenseByContact,
    updateSpocDetails,
    getContactFilterValues,
    getTeamMembers,
    uploadEmployeeSheet,
    uploadProjectTeamSheet,
    uploadPayrollSheet,
    getContactFilterValuesList,
    getContactFieldOptions,
    updateTeamMember,
    getEmployeeSheet,
    getEmployeeWagesSheet,
    getTeamMemberReport
}