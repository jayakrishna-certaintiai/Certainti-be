const { Router } = require("express");
const {
    getAllDocuments,
    uploadDocuments,
    downloadDocument,
    getDocumentFilterValues
} = require("../controllers/documents.controller.js");

const upload = require("../middlewares/multer.middleware.js");
const authorize = require("../middlewares/auth.middleware.js");
const { validateDocument } = require("../middlewares/timesheet-validator.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");

const documentRouter = Router();

// documentRouter.post(
//   "/:userId/:companyId/timesheet-upload",
//   upload.single("timesheet"),
//   uploadTimesheet
// );

// documentRouter.post(
//   "/:userId/:companyId/check-timesheet-status", 
//   checkToUpdate
// );

// documentRouter.get(
//   "/:userId/:companyId/timesheet-logs",
//   fetchTimesheetUploadLogs
// );

documentRouter.get("/get-documents-filter-values", authorize_jwt, getDocumentFilterValues);
documentRouter.get("/:user/get-docs", authorize_jwt, getAllDocuments);
documentRouter.post("/:user/upload-doc", authorize_jwt, upload.array("documents", process.env.DOCUMENT_UPLOAD_COUNT_LIMIT), validateDocument, uploadDocuments);
documentRouter.get("/:user/:filename/download", authorize_jwt, downloadDocument);
// documentRouter.post("/:userId/upload-doc", uploadDocument);


module.exports = documentRouter;