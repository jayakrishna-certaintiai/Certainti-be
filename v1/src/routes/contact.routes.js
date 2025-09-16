const { Router } = require("express");
const {
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
} = require("../controllers/contact.controller");
const authorize = require("../middlewares/auth.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");
const contactRouter = Router();
const upload = require("../middlewares/multer.middleware.js");

contactRouter.get("/get-contacts-filter-values", authorize_jwt, getContactFilterValues);
contactRouter.get("/:user/:company/get-contacts", authorize_jwt, authorize('contacts', 'read'), getContacts);
contactRouter.post("/:user/:company/create-contact", authorize_jwt, authorize('contacts', 'create'), createContact);
contactRouter.put("/:user/:company/update-contact/:contact", authorize_jwt, authorize('contactsdetails', 'update'), updateContact);
contactRouter.get("/:user/:company/:contact/get-contact-details", authorize_jwt, authorize('contactsdetails', 'read'), getContactById);
contactRouter.get("/:user/:company/:contact/get-projects", authorize_jwt, authorize('contactsprojects', 'read'), getProjectsByContact);
contactRouter.get("/:user/:company/:contact/get-contact-salary", authorize_jwt, authorize('contactsalary', 'read'), getSalaryByContact);
contactRouter.get("/:user/:company/:contact/get-rnd-expense-by-contact", authorize_jwt, authorize('contactsrdexpense', 'read'), getRnDExpenseByContact);
contactRouter.post("/update-spoc", authorize_jwt, updateSpocDetails)

contactRouter.get("/get-contact-filter-values", authorize_jwt, getContactFilterValuesList);
contactRouter.get("/get-team-members", authorize_jwt, getTeamMembers);
contactRouter.get("/get-contact-field-options", getContactFieldOptions);
contactRouter.post("/update-team-member", updateTeamMember);

//sheets
contactRouter.post("/:userId/:companyId/upload-employee-sheet", upload.single("employees"), authorize_jwt, uploadEmployeeSheet);
contactRouter.post("/:userId/:companyId/upload-project-team-sheet", upload.single("projectTeam"), authorize_jwt, uploadProjectTeamSheet);
contactRouter.post("/:userId/:companyId/upload-payroll-sheet", upload.single("payroll"), authorize_jwt, uploadPayrollSheet);

//download
contactRouter.get("/download-employees-report", authorize_jwt, getEmployeeSheet);
contactRouter.get("/download-employees-wages-report", authorize_jwt, getEmployeeWagesSheet);

contactRouter.get("/download-team-member-report", authorize_jwt, getTeamMemberReport);

module.exports = contactRouter;
