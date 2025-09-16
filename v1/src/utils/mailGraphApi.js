const axios = require('axios');
require('dotenv').config();
const fs = require('fs').promises;
const authQueries = require("../queries/auth.queries");


const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;
const tenantId = process.env.TENANT_ID;

async function accessToken() {
    const tokenData = new URLSearchParams();
    // tokenData.append('grant_type', 'client_credentials');
    tokenData.append('client_id', clientId);
    tokenData.append('client_secret', clientSecret);
    tokenData.append('scope', 'https://graph.microsoft.com/.default');
    tokenData.append('grant_type', 'password');
    tokenData.append('username', username);
    tokenData.append('password', password);

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    try {
        // Here, 'await' is used to pause the function execution until the Promise resolves
        const response = await axios.post(tokenUrl, tokenData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Once the promise resolves, the result is returned
        return response.data.access_token;
    } catch (error) {
        if (error.response) {
            console.error('Error in accessToken - Status:', error.response.status);
            console.error('Error in accessToken - Data:', error.response.data);
            console.error('Error in accessToken - Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error in accessToken - No response received:', error.request);
        } else {
            console.error('Error in accessToken - Setup issue:', error.message);
        }
        throw error;
    }
}

async function sendOtpOverMail(email, name, message, otp) {
    try {
        const token = await accessToken(clientId, clientSecret);

        let feature = "LOGIN";
        let purpose;
        switch (message) {
            case "Email verification for Forgot passowrd": purpose = "OTP FORGOT PASSWORD";
                break;
            case "Email verification for Login": purpose = "OTP LOGIN";
                break;
            case "Email verification for 2FA reset": purpose = "OTP 2FA RESET";
                break;
        }

        const loginConfiguration = await authQueries.getOrCreateLoginMailConfiguration(feature, purpose);

        let subject = loginConfiguration.dataValues.subject;
        let body = loginConfiguration.dataValues.body;

        const expiry = process.env.OTP_EXPIRY_MINUTES || 'X';

        body = body.replaceAll('${name}', name);
        body = body.replaceAll('${inMessage}', subject.replace("Email verification for ", ""));
        body = body.replaceAll('${expiry}', expiry);
        body = body.replaceAll('${otp}', otp);
        body = body.replaceAll('${username}', username);

        const headers = {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };

        const messagePayload = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": email
                        }
                    }
                ]
            },
            "saveToSentItems": true
        };

        const url = `https://graph.microsoft.com/v1.0/me/sendMail`;


        const response = await axios.post(url, messagePayload, { headers });

        return {
            otp,
            mailSentStatus: response.status,
            status: true
        };
    } catch (error) {
        if (error.response) {
            console.error('Error in sendOtpOverMail - Status:', error.response.status);
            console.error('Error in sendOtpOverMail - Data:', error.response.data);
            console.error('Error in sendOtpOverMail - Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error in sendOtpOverMail - No response received:', error.request);
        } else {
            console.error('Error in sendOtpOverMail - Setup issue:', error.message);
        }
        throw new Error('Failed to send email: ' + error.message);
    }
}

async function sendMail(email, body, subject, ccs) {
    try {
        const token = await accessToken(clientId, clientSecret);

        const headers = {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };

        const messagePayload = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": email
                        }
                    }
                ],
                "ccRecipients": ccs.map(cc => ({
                    "emailAddress": {
                        "address": cc
                    }
                })),
            },
            "saveToSentItems": true
        };

        const url = `https://graph.microsoft.com/v1.0/me/sendMail`;


        const response = await axios.post(url, messagePayload, { headers });

        return {
            mailSentStatus: response.status,
            status: true
        };
    } catch (error) {
        if (error.response) {
            console.error('Error in sendOtpOverMail - Status:', error.response.status);
            console.error('Error in sendOtpOverMail - Data:', error.response.data);
            console.error('Error in sendOtpOverMail - Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error in sendOtpOverMail - No response received:', error.request);
        } else {
            console.error('Error in sendOtpOverMail - Setup issue:', error.message);
        }
        throw new Error('Failed to send email: ' + error.message);
    }
}

async function sendFile(email, body, subject, filePath, ccs) {
    try {
        const token = await accessToken(clientId, clientSecret);

        const headers = {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };

        // Read the file content
        const fileContent = await fs.readFile(filePath);

        const messagePayload = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": email
                        }
                    }
                ],
                "ccRecipients": ccs.map(cc => ({
                    "emailAddress": {
                        "address": cc
                    }
                })),
                "attachments": [
                    {
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": filePath.split('/').pop(), // Replace with actual file name
                        "contentBytes": fileContent.toString('base64') // Encode file content to base64
                    }
                ]
            },
            "saveToSentItems": true
        };

        const url = `https://graph.microsoft.com/v1.0/me/sendMail`;

        const response = await axios.post(url, messagePayload, { headers });

        return {
            mailSentStatus: response.status,
            status: true
        };
    } catch (error) {
        if (error.response) {
            console.error('Error in sendFile - Status:', error.response.status);
            console.error('Error in sendFile - Data:', error.response.data);
            console.error('Error in sendFile - Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error in sendFile - No response received:', error.request);
        } else {
            console.error('Error in sendFile - Setup issue:', error.message);
        }
        throw new Error('Failed to send email: ' + error.message);
    }
}


async function sendSheetFailMessage(emails, ccs, subject, body) {
    try {
        const token = await accessToken(clientId, clientSecret);

        const headers = {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };

        const messagePayload = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": body
                },
                "toRecipients": emails.map(email => ({
                    "emailAddress": {
                        "address": email
                    }
                })),
                "ccRecipients": ccs.map(cc => ({
                    "emailAddress": {
                        "address": cc
                    }
                }))
            },
            "saveToSentItems": true
        };

        const url = `https://graph.microsoft.com/v1.0/me/sendMail`;

        const response = await axios.post(url, messagePayload, { headers });

        return {
            mailSentStatus: response.status,
            status: true
        };
    } catch (error) {
        if (error.response) {
            console.error('Error in sendOtpOverMail - Status:', error.response.status);
            console.error('Error in sendOtpOverMail - Data:', error.response.data);
            console.error('Error in sendOtpOverMail - Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error in sendOtpOverMail - No response received:', error.request);
        } else {
            console.error('Error in sendOtpOverMail - Setup issue:', error.message);
        }
        throw new Error('Failed to send email: ' + error.message);
    }
}


async function sendMailForUploadedSheets(acceptedFiles, rejectedFiles, userName, email) {
    try {
        // Format accepted files list as HTML
        const acceptedFilesHtml = acceptedFiles.map(file => `<li>${file.fileName}</li>`).join('');

        // Format rejected files list as HTML, showing fileName and message
        const rejectedFilesHtml = rejectedFiles.map(file => `<li><strong>${file.fileName}</strong>: ${file.message}</li>`).join('');

        // Construct the email body
        const body = `
            <p>Dear ${userName},</p>
            <p>The sheets you uploaded have been processed. Here is the status of your upload:</p>
            
            <p><strong>Accepted Files:</strong></p>
            <ul>${acceptedFilesHtml}</ul>
            
            <p><strong>Rejected Files:</strong></p>
            <ul>${rejectedFilesHtml}</ul>
            
            <p>Please re-upload the rejected files after making the necessary corrections.</p><br><br>
        `;

        const subject = `Survey Sheets Upload Status`;

        // Obtain the token for authorization
        const token = await accessToken(clientId, clientSecret);

        const headers = {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };

        const messagePayload = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": email
                        }
                    }
                ]
            },
            "saveToSentItems": true
        };

        const url = `https://graph.microsoft.com/v1.0/me/sendMail`;
        const response = await axios.post(url, messagePayload, { headers });

        console.log('Email sent successfully:', response.data);

    } catch (error) {
        console.error('Error sending mail for uploaded sheets:', error.response ? error.response.data : error.message);
    }
}



module.exports = {
    sendOtpOverMail, sendFile, sendMail, sendSheetFailMessage, sendMailForUploadedSheets
}