const DB_NAME = process.env.DB_NAME
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY

const TIMESHEET_FILE_FORMAT = ['csv', 'xlsx'];
const TIMESHEET_FILE_SIZE = 1024 * 1024 * 500;

//forgot password
const OTP_EXPIRY_DAYS = process.env.OTP_EXPIRY_DAYS
const OTP_EXPIRY_HOURS = process.env.OTP_EXPIRY_HOURS
const OTP_EXPIRY_MINUTES = process.env.OTP_EXPIRY_MINUTES
const OTP_CIPHER_KEY = process.env.OTP_CIPHER_KEY
const OTP_LENGTH = process.env.OTP_LENGTH
const OTP_ALPHANUMERIC = process.env.OTP_ALPHANUMERIC
const USER_ID_KEY = process.env.USER_ID_KEY

//sheets
const PROJECT_SHEETS_MANDATORY_COLUMNS = ['projectName', 'projectCode'];
const EMPLOYEE_SHEETS_MANDATORY_COLUMNS = ['employeeId'];
const PROJECT_TEAM_SHEETS_MANDATORY_COLUMNS = ['employeeid', 'projectId'];
const PAYROLL_SHEETS_MANDATORY_COLUMNS = ['employeeid', 'hourlyRate', 'startDate'];
const PAYROLL_SHEET_VALUE_DATA_TYPES = {
    hourlyRate: "NUMBER",
    startDate: "DATE",
    endDate: "DATE",
    annualRate: "NUMBER"
};
const PROJECT_SHEET_VALUE_DATA_TYPES = {
    s_fte_cost: "NUMBER",
    s_subcon_cost: "NUMBER",
    s_total_project_cost: "NUMBER",
    s_fte_hours: "NUMBER",
    s_subcon_hours: "NUMBER",
    s_total_hours: "NUMBER",
    s_rnd_adjustment: "NUMBER",
    s_fte_qre_cost: "NUMBER",
    s_subcon_qre_cost: "NUMBER",
    s_qre_cost: "NUMBER",
    plannedDuration: "NUMBER",
    actualDuration: "NUMBER",
    s_rd_credits: "NUMBER",

    startDate: "DATE",
    endDate: "DATE",
    actualStartDate: "DATE",
    actualEndDate: "DATE",

    s_project_status: "OPTIONS",
    s_data_gathering: "OPTIONS",
    s_pending_data: "OPTIONS",
    s_timesheet_status: "OPTIONS",
    s_fte_cost_status: "OPTIONS",
    s_subcon_cost_status: "OPTIONS",
    s_interaction_status: "OPTIONS",
    s_technical_interview_status: "OPTIONS",
    s_technical_summary_status: "OPTIONS",
    s_financial_summary_status: "OPTIONS",
    s_claims_form_status: "OPTIONS",
    s_final_review_status: "OPTIONS"
};

//mail configurations
const companyDefaultMailConfigurations = {
    SURVEY: {
        "OTP": {
            subject: "Survey OTP for || ${projectName} || ${projectCode} || ${accountName}",
            body: "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Survey Invitation</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "    Dear ${spocName},\n" +
                "    Thank you for participating in our survey. To ensure the security of your responses, we have implemented a One-Time Password (OTP) authentication process. Please use the following OTP to access the survey:<br>\n" +
                "    Your OTP: <b>${otp}</b><br><br>\n" +
                "</body>\n" +
                "</html>"
        },
        "SEND": {
            subject: "R&D Credits Claims Survey for ${accountName} || ${projectId} || ${projectName}",
            body: "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Survey Invitation</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <p>Dear ${spocName},</p>\n" +
                "    <p>Greetings For The Day!</p>\n" +
                "    <p>We are conducting a survey for R&D Credits Claims Process for <b>${accountName}</b> fiscal year ${fiscalYear} for the project <b>${projectName} (Project ID: ${projectId})</b>.</p>\n" +
                "    <br>\n" +
                "    <p>Please take a moment to complete the survey using one of the following options.</p>\n" +
                "    <p>1. <b><a href=\"${url}\">Please Click on this Link to complete the survey.</a></b></p>\n" +
                "    <p>If you are not able to access the above link due to security restrictions, please use option #2</p>\n" +
                "    <br><b>OR</b><br><br>\n" +
                "    <p>2. Fill the answers in the attached excel template and simply reply back to this email.</p>\n" +
                "    <p>Your responses are invaluable to us and will contribute significantly to our efforts. Upon completion, submit the survey, and your responses will be securely forwarded to us for further processing.</p>\n" +
                "    <p>ResDev Tax Consultants</p>\n" +
                "    <p>Powered By Certainti.ai</p>\n" +
                "    <br><br>\n" +
                "</body>\n" +
                "</html>"
        },
        "REMINDER": {
            subject: "Friendly Reminder: Survey for R&D Credits Claims Process - ${accountName} || ${projectId} || ${projectName}",
            body: "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Survey Reminder</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "    Dear ${receiverName},<br>\n" +
                "    <p>This is a gentle reminder regarding the <b>R&D Credits Claims Process</b> survey for the project <b>${projectName} (Project ID: ${projectId}) ${accountName}</b> for the fiscal year ${fiscalYear}. Your input is greatly appreciated and important to our process. If you haven't had the chance to complete the survey yet, please use one of the following options:</p>\n" +
                "    1. <a href=\"${url}\">Click on this [Link]</a> to complete the survey.<br>\n" +
                "    OR<br>\n" +
                "    2. Fill in your responses in the attached Excel template and simply reply back to this email.<br>\n" +
                "    <p>We value your cooperation, and your responses will significantly contribute to our efforts. Please let us know if you need any assistance or have any questions. Thank you again for your time and support.</p>\n" +
                "    Best regards,<br>\n" +
                "    ResDev Tax Consultants<br>\n" +
                "    Powered by Certainti.ai<br><br>\n" +
                "</body>\n" +
                "</html>"
        },
        "RESPONSE RECEIVED - USER": {
            subject: "Survey Response Received for ${accountName} || ${projectId} || ${projectName}",
            body: "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Survey Invitation</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "    Dear ${name},<br><br>\n" +
                "    Thank you for sending the R&D Survey for ${projectId} - ${projectName}. It is now successfully recorded.<br><br>\n" +
                "    <u><b>Details:</b></u><br>\n" +
                "    Submitted by: ${name}<br>\n" +
                "    Date & Time: ${date}<br><br>\n" +
                "    Please write to <span style=\"color: #0000EE;\">${support}</span> in case you have any questions.<br><br>\n" +
                "    Thank You,<br>\n" +
                "    ResDev Support Team<br><br>\n" +
                "</body>\n" +
                "</html>"
        },
        "RESPONSE RECEIVED - SUPPORT TEAM": {
            subject: "Survey Response Received for ${accountName} || ${projectId} || ${projectName}",
            body: "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Survey Invitation</title>\n" +
                "</head>\n" +
                "<body>\n" +
                "    Dear ResDev Team,<br><br>\n" +
                "    You have received a response for R&D Survey ${projectId} - ${projectName}. It is now successfully recorded.<br><br>\n" +
                "    <u><b>Details:</b></u><br>\n" +
                "    Submitted by: ${name}<br>\n" +
                "    Date & Time: ${date}<br><br>\n" +
                "    Thank You,<br>\n" +
                "    Customer Success Team<br><br>\n" +
                "</body>\n" +
                "</html>"
        }
    },

    INTERACTION: {
        "OTP": {
            subject: "Assessment OTP for || ${projectName} || ${projectCode} || ${accountName}",
            body: "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Survey Invitation</title>" +
                "</head>" +
                "<body>" +
                "Dear ${spocName}, " +
                "Thank you for participating in our assessment. To ensure the security of your responses, we have implemented a One-Time Password (OTP) authentication process. Please use the following OTP to access the assessment:<br>" +
                "Your OTP: <b>${otp}</b><br><br>" +
                "</body>" +
                "</html>"
        },
        "SEND": {
            subject: "Assessment(ID - ${interactionId}) for || ${projectName} || ${projectCode} || ${accountName}",
            body: "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Survey Invitation</title>" +
                "</head>" +
                "<body>" +
                "<p>Dear ${spocName},</p>" +
                "<p>Greetings For The Day!</p>" +
                "<p>This is regarding the project ${projectName} (Project ID: ${projectCode}) related to R&D Credits Claims Process for fiscal year ${fiscalYear}.</p>" +
                "<p>Please take a moment to answer the questions related to the project by using one of the options below.</p>" +
                "<p>1. Using the link --> <b><a href=\"${url}\">Interaction Link</a></b></p>" +
                "<br><b>OR</b><br>" +
                "<p>2. Fill the answers in the attached excel template and simply reply back to this email.</p>" +
                "<p>Your responses are invaluable to us and will contribute significantly to our efforts. Upon completion, click on submit, and your responses will be securely forwarded to us for further processing.</p>" +
                "<p>Thank you for your cooperation and support.</p>" +
                "<p>ResDev Tax Consultants<br>Powered By Certainti.ai</p>" +
                "<br><br>" +
                "</body>" +
                "</html>"
        },
        "REMINDER": {
            subject: "Friendly Reminder: Assessment(ID - ${interactionId}) for || ${projectName} || ${projectCode} || ${accountName}",
            body: "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Survey Invitation</title>" +
                "</head>" +
                "<body>" +
                "<p>Dear ${spocName},</p>" +
                "<p>Greetings For The Day!</p>" +
                "<p>This is a quick reminder to fill in the necessary details related to the project ${projectName} (Project ID: ${projectCode}) related to R&D Credits Claims Process for fiscal year ${fiscalYear}.</p>" +
                "<p>Please take a moment to answer the questions by using one of the options below.</p>" +
                "<p>1. Using the link --> <b><a href=\"${url}\">Interaction Link</a></b></p>" +
                "<br><b>OR</b><br>" +
                "<p>2. Fill the answers in the attached excel template and simply reply back to this email.</p>" +
                "<p>Your responses are invaluable to us and will contribute significantly to our efforts. Upon completion, click on submit, and your responses will be securely forwarded to us for further processing.</p>" +
                "<p>Thank you for your cooperation and support.</p>" +
                "<p>ResDev Tax Consultants<br>Powered By Certainti.ai</p>" +
                "<br><br>" +
                "</body>" +
                "</html>"
        },
        "RESPONSE RECEIVED - USER": {
            subject: "Assessment(ID - ${interactionId}) Response Received for ${accountName} || ${projectCode} || ${projectName}",
            body: "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Survey Invitation</title>" +
                "</head>" +
                "<body>" +
                "Dear ${name},<br><br>" +
                "Thank you for sending the R&D assessment for ${projectCode} - ${projectName}. It is now successfully recorded.<br><br>" +
                "<u><b>Details:</b></u><br>" +
                "Submitted by: ${name}<br>" +
                "Date & Time: ${date}<br><br>" +
                "Please write to <span style=\"color: #0000EE;\">${support}</span> in case you have any questions.<br><br>" +
                "Thank You,<br>" +
                "ResDev Support Team<br><br>" +
                "</body>" +
                "</html>"
        },
        "RESPONSE RECEIVED - SUPPORT TEAM": {
            subject: "Assessment(ID - ${interactionId}) Response Received for ${accountName} || ${projectCode} || ${projectName}",
            body: "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Survey Invitation</title>" +
                "</head>" +
                "<body>" +
                "Dear ResDev Team,<br><br>" +
                "You have received a response for the R&D assessment ${projectCode} - ${projectName}. It is now successfully recorded.<br><br>" +
                "<u><b>Details:</b></u><br>" +
                "Submitted by: ${name}<br>" +
                "Date & Time: ${date}<br><br>" +
                "Thank You,<br>" +
                "Customer Success Team<br><br>" +
                "</body>" +
                "</html>"
        }
    },


    LOGIN: {
        "OTP LOGIN": {
            subject: "Email verification for Login",
            body: "Dear ${name},<br>" +
                "<p>We received a request to ${inMessage} for your Certainty account. Please use the following One-Time Password (OTP) to set your new password. This OTP is valid for ${expiry} minutes and can be used only once.</p>" +
                "<p><b>OTP: ${otp}</b></p>" +
                "<p>If you did not request a password reset, please ignore this email or contact us immediately at <a href=\"mailto:${username}\">${username}</a>.</p>" +
                "<p>For your security, never share your OTP with anyone.</p>" +
                "<p>If you encounter any issues or have questions, please do not hesitate to reach out to our support team at <a href=\"mailto:${username}\">${username}</a>.</p>" +
                "<p>Thank you for using Certainti.</p>" +
                "<b>Regards,</b><br>" +
                "Certainti<br><br>" +
                "<b>LEGAL DISCLAIMER</b><br>" +
                "This email message and any attachments may contain legally privileged, confidential, or proprietary information. If you are not the intended recipient(s), or the employee or agent responsible for delivery of this message to the intended recipient(s), you are hereby notified that any dissemination, distribution, or copying of this email message is strictly prohibited. If you have received this message in error, please immediately notify the sender and delete this email message from your computer.<br><br>" +
                "<b>Information Protection:</b> Any information or data shared in response to this email will be handled in accordance with Certainti's security and privacy policies. For further details regarding our terms and conditions, please visit <a href=\"http://abc.cc\">abc.cc</a>.<br><br>"
        },
        "OTP FORGOT PASSWORD": {
            subject: "Email verification for Forgot Password",
            body: "Dear ${name},<br>" +
                "<p>We received a request to ${inMessage} for your Certainty account. Please use the following One-Time Password (OTP) to set your new password. This OTP is valid for ${expiry} minutes and can be used only once.</p>" +
                "<p><b>OTP: ${otp}</b></p>" +
                "<p>If you did not request a password reset, please ignore this email or contact us immediately at <a href=\"mailto:${username}\">${username}</a>.</p>" +
                "<p>For your security, never share your OTP with anyone.</p>" +
                "<p>If you encounter any issues or have questions, please do not hesitate to reach out to our support team at <a href=\"mailto:${username}\">${username}</a>.</p>" +
                "<p>Thank you for using Certainti.</p>" +
                "<b>Regards,</b><br>" +
                "Certainti<br><br>" +
                "<b>LEGAL DISCLAIMER</b><br>" +
                "This email message and any attachments may contain legally privileged, confidential, or proprietary information. If you are not the intended recipient(s), or the employee or agent responsible for delivery of this message to the intended recipient(s), you are hereby notified that any dissemination, distribution, or copying of this email message is strictly prohibited. If you have received this message in error, please immediately notify the sender and delete this email message from your computer.<br><br>" +
                "<b>Information Protection:</b> Any information or data shared in response to this email will be handled in accordance with Certainti's security and privacy policies. For further details regarding our terms and conditions, please visit <a href=\"http://abc.cc\">abc.cc</a>.<br><br>"
        },
        "OTP 2FA RESET": {
            subject: "Email verification for 2FA Reset",
            body: "Dear ${name},<br>" +
                "<p>We received a request to ${inMessage} for your Certainty account. Please use the following One-Time Password (OTP) to set your new password. This OTP is valid for ${expiry} minutes and can be used only once.</p>" +
                "<p><b>OTP: ${otp}</b></p>" +
                "<p>If you did not request a password reset, please ignore this email or contact us immediately at <a href=\"mailto:${username}\">${username}</a>.</p>" +
                "<p>For your security, never share your OTP with anyone.</p>" +
                "<p>If you encounter any issues or have questions, please do not hesitate to reach out to our support team at <a href=\"mailto:${username}\">${username}</a>.</p>" +
                "<p>Thank you for using Certainti.</p>" +
                "<b>Regards,</b><br>" +
                "Certainti<br><br>" +
                "<b>LEGAL DISCLAIMER</b><br>" +
                "This email message and any attachments may contain legally privileged, confidential, or proprietary information. If you are not the intended recipient(s), or the employee or agent responsible for delivery of this message to the intended recipient(s), you are hereby notified that any dissemination, distribution, or copying of this email message is strictly prohibited. If you have received this message in error, please immediately notify the sender and delete this email message from your computer.<br><br>" +
                "<b>Information Protection:</b> Any information or data shared in response to this email will be handled in accordance with Certainti's security and privacy policies. For further details regarding our terms and conditions, please visit <a href=\"http://abc.cc\">abc.cc</a>.<br><br>"
        }
    }
}


const SURVEY_TIER_QUESTIONS = {
    2: {
        template: {
            questionsCount: 8
        },
        questions: [
            {
                sequence: 1,
                question: "What is a brief description of the project work completed during the assessment year? (in no less than 50 words)",
                description: "Provide a concise summary of the overall project, its goals, and activities. Highlight problem areas and innovations."
            },
            {
                sequence: 2,
                question: "Who were the key technical team members involved in the project, and what improvements were achieved through their work?",
                description: "Mention names, roles, and contributions of key personnel. Explain how their work added value."
            },
            {
                sequence: 3,
                question: "What key features, functions, or automation tasks were built, enhanced, or delivered during the project?",
                description: "Describe modules, tools, or tasks developed or optimized. Include automation-related achievements."
            },
            {
                sequence: 4,
                question: "What technical challenges did the team face, what research or validation activities were performed to address them, and what new solutions were developed beyond standard practice?",
                description: "Mention non-trivial challenges, how you researched solutions, and what innovative approaches were implemented."
            },
            {
                sequence: 5,
                question: "What major technological design choices, architectural decisions, or trade-offs were made during the project?",
                description: "Explain important architecture or design changes, and any trade-offs made between complexity, performance, and cost."
            },
            {
                sequence: 6,
                question: "What measurable outcomes or benefits were delivered by the project, such as efficiency gains, cost savings, user experience improvements, or business process optimizations?",
                description: "Focus on quantifiable results (time saved, accuracy, cost reduction, etc.) or business improvements."
            },
            {
                sequence: 7,
                question: "What reusable technical knowledge, methods, frameworks, or best practices were created during the project?",
                description: "List items that could benefit other teams or future projects: frameworks, documentation, libraries, etc."
            },
            {
                sequence: 8,
                question: "Is there any additional technical information you would like to highlight about this project?",
                description: "Add specific technical insights, experiments, or performance metrics that demonstrate depth."
            },
            {
                sequence: 9,
                question: "Any Additional Information you could provide regarding the project?",
                description: "Share organizational impact, stakeholder feedback, innovation culture, or roadmap hints."
            }
        ]
    }
};





module.exports = {
    DB_NAME, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, TIMESHEET_FILE_FORMAT, TIMESHEET_FILE_SIZE,
    OTP_EXPIRY_DAYS, OTP_EXPIRY_HOURS, OTP_EXPIRY_MINUTES,
    OTP_CIPHER_KEY, OTP_LENGTH, OTP_ALPHANUMERIC, USER_ID_KEY, ACCESS_TOKEN_EXPIRY,
    PROJECT_SHEETS_MANDATORY_COLUMNS, EMPLOYEE_SHEETS_MANDATORY_COLUMNS, PROJECT_TEAM_SHEETS_MANDATORY_COLUMNS, PAYROLL_SHEETS_MANDATORY_COLUMNS,
    PAYROLL_SHEET_VALUE_DATA_TYPES, PROJECT_SHEET_VALUE_DATA_TYPES,
    companyDefaultMailConfigurations,
    SURVEY_TIER_QUESTIONS
}
