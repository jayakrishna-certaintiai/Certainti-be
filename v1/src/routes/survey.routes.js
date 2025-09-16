const { Router } = require("express");
const {
  authenticateLinkAndSendOtp,
  verifyOtpAndGetSurveyData,
  saveAnswer,
  updateSurveyQuestions
} = require("../controllers/survey.controller.js");

const surveyRouter = Router();

surveyRouter.get("/:encryption/authenticate", authenticateLinkAndSendOtp);
surveyRouter.post("/:encryption/verifyotp", verifyOtpAndGetSurveyData);
surveyRouter.post("/:encryption/save", saveAnswer);
// surveyRouter.get("/update-survey-questions", updateSurveyQuestions);


module.exports = surveyRouter;
