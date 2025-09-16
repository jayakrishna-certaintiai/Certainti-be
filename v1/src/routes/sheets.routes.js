const { Router } = require("express");
const {
    getUploadedSheets,
    getSheetFilterValues,

} = require("../controllers/sheets.controller.js");

const authorize = require("../middlewares/auth.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");
const sheetsRouter = Router();

sheetsRouter.get("/get-upload-sheets",authorize_jwt, getUploadedSheets);

sheetsRouter.get("/get-sheets-filter-values", authorize_jwt, getSheetFilterValues);


module.exports = sheetsRouter;