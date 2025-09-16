const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { verifyHashedPassword, createHashedPassword } = require("../utils/bcrypt");
const authQueries = require("../queries/auth.queries");
const { sendOtpOverMail, sendMail } = require("../utils/mailGraphApi");
const PlatformUsers = require("../models/platform-users.model");

const qrcode = require("qrcode");
const { authenticator } = require("otplib");
const constants = require("../constants");
const platformusers = require("../queries/platformusers.queries");
const crypto = require('../utils/crypto');
const { generateOtp } = require("../utils/otp");
const sessionService = require("../utils/sessionService")


const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(200).json(
                new ApiResponse(null, "Enter email and password!", false)
            )
        }

        const isUserValid = await authQueries.ifUserExists(email);

        if (!isUserValid.status) {
            return res.status(404).json(
                new ApiResponse(null, "User Not found", false)
            )
        }

        const user = isUserValid.data;

        const match = await verifyHashedPassword(password, user.password);

        if (!match) {
            return res
                .status(200)
                .json(
                    new ApiResponse(null, "Incorrect password", false)
                );
        }

        if (!user.isMfaRequired) {
            const details = await authQueries.getUserRoleDetails(user.userId);
            const encrypt_userId = crypto.encryptText(user.userId, constants.USER_ID_KEY);
            const accessToken = generateAccessToken(encrypt_userId, user.email);

            const sessionId = user.userId + accessToken.substring(accessToken.length - 7);

            // Update session
            sessionService.createOrUpdateSession(sessionId, { userId: user.userId });

            const data = {
                tokens: {
                    accessToken,
                },
                userInfo: details.userInfo,
                rolesInfo: details.rolesInfo,
            };

            return res.status(200).json(
                new ApiResponse({
                    isMfaRequired: false,
                    data,
                }, "Login successful", true)
            );
        }
        else if (!user.MFA_ENABLED && user.isMfaRequired) {
            //user verify with otp
            if (!user.MFA_SECRET) {
                return res.status(200).json(
                    new ApiResponse({
                        "TwoFA": false,
                        "isMfaRequired": true
                    }, "Verify User", true)
                );
            }

            const secret = authenticator.generateSecret();
            const uri = authenticator.keyuri(user.email, "certainti.ai", secret);
            const image = await qrcode.toDataURL(uri);

            //update user mfaSecret
            await authQueries.updateuserMfaSecret(user.email, secret);

            return res.status(200).json(
                new ApiResponse({
                    "QRCode": image,
                    "TwoFA": false,
                    "isMfaRequired": true
                }, "QR Code Send", true)
            )
        } else if (user.MFA_ENABLED && user.isMfaRequired) {
            return res.status(200).json(
                new ApiResponse({
                    "TwoFA": true,
                    "isMfaRequired": true,
                }, "Enter TOTP", true)
            );
        }

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const sendOtp = async (req, res) => {
    try {

        const { email, password, forgotPassword, verifyUser, resetTwoFa } = req.body;

        let message;
        if (forgotPassword) message = "Email verification for Forgot passowrd";
        else if (verifyUser) message = "Email verification for Login";
        else if (resetTwoFa) message = "Email verification for 2FA reset";

        //validate request
        if (!email) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "Enter email !", false)
            )
        }

        //check user exists
        const isUserValid = await authQueries.ifUserExists(email);

        if (!isUserValid.status) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "User Not found", false)
            );
        }

        const user = isUserValid.data;

        if (!(forgotPassword || verifyUser || resetTwoFa)) {
            return res.status(400).json(
                new ApiError("Invalid Request")
            );
        }

        if (verifyUser || resetTwoFa) {
            //verify password
            const match = await verifyHashedPassword(password, user.password);
            if (!match) {
                return res
                    .status(200)
                    .json(
                        new ApiResponse(null, "Incorrect password", false)
                    );
            }
        }

        //otp expiry date
        const expiryTimeInSeconds = Math.floor((Date.now() + (constants.OTP_EXPIRY_DAYS * 24 * 60 * 60 * 1000) +
            (constants.OTP_EXPIRY_HOURS * 60 * 60 * 1000) + (constants.OTP_EXPIRY_MINUTES * 60 * 1000)) / 1000);

        const expiryTimeInDate = new Date(expiryTimeInSeconds * 1000);

        //generate otp
        // const OTP = JSON.stringify(await generateOtp(constants.OTP_LENGTH, constants.OTP_ALPHANUMERIC));
        const OTP = await generateOtp(constants.OTP_LENGTH, constants.OTP_ALPHANUMERIC);
        const cipher = crypto.encrypt(OTP, constants.OTP_CIPHER_KEY);
        //insert expiry time and otp in platformusers table
        await platformusers.updateOtpAndExpiry(email, OTP, expiryTimeInDate, cipher);

        //send otp to user mail
        await sendOtpOverMail(email, user.firstName + " " + user.lastName, message, OTP);

        return res.status(200).json(
            new ApiResponse({
                messageId: 1
            }, "OTP Sent to Email", true)
        );
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const verifyOtpOrTotp = async (req, res) => {
    try {
        const { email, password, forgotPassword, verifyUser, otp, resetTwoFa, verifyTotp, totp } = req.body;
        const currentTimeInSeconds = Math.floor((Date.now()) / 1000);

        if (!(forgotPassword || verifyUser || resetTwoFa || verifyTotp)) {
            return res.status(400).json(
                new ApiError("Invalid Request")
            );
        }

        //validate email
        if (!email) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "Enter email !", false)
            );
        }

        //check user exists
        const isUserValid = await authQueries.ifUserExists(email);

        if (!isUserValid.status) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "User Not found", false)
            );
        }

        const user = isUserValid.data;

        //verify password for verifyUser, resetTwoFa
        if (verifyUser || resetTwoFa) {
            const match = await verifyHashedPassword(password, user.password);
            if (!match) {
                return res
                    .status(200)
                    .json(
                        new ApiResponse(null, "Incorrect password", false)
                    );
            }
        }


        //verify otp for forgotPassword, verifyUser , resetTwoFa
        if (forgotPassword || verifyUser || resetTwoFa) {
            //verify otp
            if (!otp) {
                return res.status(200).json(
                    new ApiResponse({ messageId: -1 }, "Enter otp !", false)
                );
            }



            const { storedCipher } = (await platformusers.getOtpDetails(email)).data;

            const expiryTimeInSeconds = Math.floor((new Date(user.otpExpiry).getTime()) / 1000);
            // Generate cipher again
            const currentCipher = crypto.encrypt(otp, constants.OTP_CIPHER_KEY);

            // Check if the generated cipher matches the stored cipher
            if (currentCipher !== storedCipher) {
                return res.status(200).json(
                    new ApiResponse({ messageId: -1 }, "OTP is Invalid", false)
                );
            }

            //check otp expiry

            if (currentTimeInSeconds > expiryTimeInSeconds) {
                return res.status(200).json(
                    new ApiResponse({ messageId: -1 }, "OTP is Expired", false)
                );
            }

            //check otp and expiry date
            if (otp != user.otp) {
                return res.status(200).json(
                    new ApiResponse({ messageId: -1 }, "OTP is Invalid", false)
                );
            }

            if (verifyUser || resetTwoFa) {
                const secret = authenticator.generateSecret();
                const uri = authenticator.keyuri(user.email, "certainti.ai", secret);
                const image = await qrcode.toDataURL(uri);
                // console.log(image); // remove it

                //update user mfaSecret
                await authQueries.updateuserMfaSecret(user.email, secret);
                await authQueries.updateuserMfaEnabled(user.email, false);

                return res.status(200).json(
                    new ApiResponse({
                        "QRCode": image,
                        "TwoFA": false
                    }, "QR Code Send", true)
                )
            }

            return res.status(200).json(
                new ApiResponse({ messageId: 1, cipher: currentCipher }, "OTP is valid", true)
            );

        }
        else if (verifyTotp) { //verify totp
            //verify totp
            if (!totp) {
                return res.status(200).json(
                    new ApiResponse({ messageId: -1 }, "Enter totp !", false)
                );
            }

            //get user data
            const details = await authQueries.getUserRoleDetails(user.userId);
            const data = {
                tokens: {
                    accessToken: generateAccessToken(user.userId),
                    refreshToken: generateRefreshToken(user.userId),
                },
                userInfo: details.userInfo,
                rolesInfo: details.rolesInfo
            }

            //totp
            const verified = authenticator.check(totp, user.MFA_SECRET);

            if (!verified) {
                return res
                    .status(200)
                    .json(
                        new ApiResponse(null, "Incorrect Code", false)
                    );
            }

            //make mfa enabled to true
            await authQueries.updateuserMfaEnabled(user.email, true);

            //change hasPasswordCHanges to false
            await PlatformUsers.update(
                { hasPasswordChanged: false },
                { where: { email: email } }
            );

            return res.status(200).json(
                new ApiResponse(data, "Login successfull", true)
            );

        }

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
}

const changePassword = async (req, res) => {
    try {
        const { email, newPassword, cipher, forgotPassword } = req.body;
        console.log('Request Body:', req.body);
        //validate request
        if (!email) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "Enter email!", false)
            );
        }
        if (!newPassword) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "Enter new password!", false)
            );
        }
        const { storedOtp, storedCipher } = (await platformusers.getOtpDetails(email)).data;

        // const expiryTimeInSeconds = Math.floor((new Date(user.otpExpiry).getTime()) / 1000);
        // Generate cipher again

        // Check if the generated cipher matches the stored cipher
        if (cipher !== storedCipher) {
            return res.status(400).json(new ApiResponse(null, "Invalid request", false));
        }

        //check user exists
        const isUserValid = await authQueries.ifUserExists(email);

        if (!isUserValid.status) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "User Not found", false)
            );
        }

        const user = isUserValid.data;

        // if (forgotPassword) {
        //     if (!cipher) {
        //         return res.status(400).json(
        //             new ApiError("Invalid Request")
        //         );
        //     }

        //     //validate cipher
        //     const originalCipher = crypto.encrypt(Math.floor((new Date(user.otpExpiry)) / 1000), constants.OTP_CIPHER_KEY);
        //     if (originalCipher !== cipher) {
        //         return res.status(400).json(
        //             new ApiError("Invalid Request")
        //         );
        //     }
        // }

        //update password
        const hashedPassword = await createHashedPassword(newPassword);
        await platformusers.updatepassword(email, hashedPassword);

        //update otp and expiry date to null
        await platformusers.updateOtpAndExpiry(email, null, null);

        return res.status(200).json(
            new ApiResponse({ messageId: 1 }, "Password Changed Successfully", true)
        );

    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }

}

const contactSupport = async (req, res) => {
    try {
        const { email, phone, content } = req.body;

        // Validate request
        if (!email) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "Enter email!", false)
            );
        }

        // Check if user exists
        const isUserValid = await authQueries.ifUserExists(email);
        if (!isUserValid.status) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "User Not found ?", false)
            );
        }

        //check query 
         if (!content) {
            return res.status(200).json(
                new ApiResponse({ messageId: -1 }, "Enter content!", false)
            );
        }

        //subject
        const subject = "USER SUPPORT REQUIRED";
        //body
        const body = `
            <b>User Query</b> :${content}
            <br>
            <br>
            <b>User Contact Info</b> : ${phone ? phone : "Not Available"}
            <br>
            <br>
            <br>
            <br>
        `;

        //ccs
        const ccs = [email];

        await sendMail(process.env.SURVEY_SUPPORT_MAIL, body, subject, ccs);

        return res.status(200).json(
            new ApiResponse({
                messageId: 1
            }, "Request Sent to Email", true)
        );
    } catch (error) {
        return res.status(500).json(new ApiError(error.message, 500, error));
    }
};

module.exports = {
    loginUser,
    sendOtp,
    verifyOtpOrTotp,
    changePassword,
    contactSupport
}