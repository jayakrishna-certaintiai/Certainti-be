const { Router } = require("express");
const {
    sendInteractions,
    authenticateLinkAndSendOtp,
    verifyOtpAndGetInteractionData,
    saveAnswer,
    createInteractions,
    sendInteractionsByUser,
    uploadInteractions,
} = require("../controllers/assessment.controller.js");

const authorize = require("../middlewares/auth.middleware.js");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt.js");
const uplaod = require("../middlewares/multer.middleware.js");

const assessmentRouter = Router();

// external assessment
assessmentRouter.post("/generate-interactions", createInteractions);
// assessmentRouter.post("/send-interactions", sendInteractions);
assessmentRouter.post("/:user/send-interactions", authorize_jwt, sendInteractionsByUser);
assessmentRouter.get("/:encryption/authenticate", authenticateLinkAndSendOtp);
assessmentRouter.post("/:encryption/verifyotp", verifyOtpAndGetInteractionData);
assessmentRouter.post("/:encryption/save", saveAnswer);

//uplaod
assessmentRouter.post("/:userId/upload-interactions", uplaod.array("files", 100), uploadInteractions);


module.exports = assessmentRouter;
