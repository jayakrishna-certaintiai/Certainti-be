const { Router } = require("express");
const {
    loginUser,
    sendOtp,
    verifyOtpOrTotp,
    changePassword,
    contactSupport,
} = require("../controllers/auth.controller");
const { authorize_jwt } = require("../middlewares/auth.middleware_jwt");
const forgotPasswordLimiter = require("../middlewares/rate-limiter.middleware.js");

const authRouter = Router();

authRouter.post("/login", loginUser);
authRouter.post("/send-otp", forgotPasswordLimiter, sendOtp);
authRouter.post("/contact-support", contactSupport);
authRouter.post("/verify-otp", verifyOtpOrTotp);
authRouter.post("/change-password", changePassword);
// authRouter.post("/reset-password",authorize_jwt, resetPassword);
// authRouter.post("/:user/:company/create-contact", createContact);
// authRouter.put("/:user/:company/update-contact/:contact", updateContact);

module.exports = authRouter;