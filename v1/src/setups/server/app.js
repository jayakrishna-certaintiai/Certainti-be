const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require('helmet');
const SESSION_CLEANUP_TIMEOUT = process.env.SESSION_CLEANUP_TIMEOUT || (60 * 24 * 7); // Default 7 days in minutes
const SESSION_TIMEOUT = process.env.SESSION_TIMEOUT || 15; // Default 15 minutes
// const passport = require('passport');
// const fs = require('fs');
// const path = require('path');

// // Azure AD B2C configuration
// const configPath = path.join(__dirname, 'config.json');
// const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.use(helmet());
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        frameAncestors: ["'none'"],
    },
}));
app.use(
    helmet.hsts({
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    })
);
app.use(helmet.noSniff());
app.use(
    helmet.referrerPolicy({
        policy: 'no-referrer' // or any other policy you prefer
    })
);
app.use(
    helmet.permittedCrossDomainPolicies({
        policy: 'none' // adjust as needed
    })
);

// // Passport.js initialization
// app.use(passport.initialize());
// app.use(passport.session());

// // Passport serialization
// passport.serializeUser((user, done) => {
//     done(null, user);
// });

// passport.deserializeUser((obj, done) => {
//     done(null, obj);
// });

// // Azure AD B2C OIDC Strategy for Passport
// passport.use(
//     new OIDCStrategy(
//         {
//             identityMetadata: `https://${config.credentials.tenantName}.b2clogin.com/${config.credentials.tenantName}.onmicrosoft.com/v2.0/.well-known/openid-configuration?p=${config.policies.policySignUpSignIn}`,
//             clientID: config.credentials.clientID,
//             responseType: 'code id_token',
//             responseMode: 'form_post',
//             redirectUrl: 'http://localhost:3000/auth/callback', // Update with your callback URL
//             allowHttpForRedirectUrl: true,
//             clientSecret: config.credentials.clientSecret,
//             validateIssuer: false,
//             passReqToCallback: false,
//             scope: ['openid', 'profile', 'email'],
//         },
//         (iss, sub, profile, accessToken, refreshToken, done) => {
//             if (!profile) {
//                 return done(new Error('No profile found'), null);
//             }
//             return done(null, profile); // Pass user profile to session
//         }
//     )
// );

// In-memory session storage
//const sessions = {};

// Function to clean up inactive sessions
// const cleanupInactiveSessions = () => {
//     const currentTime = Date.now();
//     for (const userId in sessions) {
//         const lastActivity = sessions[userId].lastActivity;
//         const timeDiff = (currentTime - lastActivity) / (1000 * 60); // in minutes

//         if (timeDiff > SESSION_TIMEOUT) {
//             if (sessions[userId]) {
//                 delete sessions[userId]; // Remove inactive sessions
//             }
//         }
//     }
// };
// // Run cleanup every SESSION_CLEANUP_TIMEOUT interval (converted to milliseconds)

// setInterval(cleanupInactiveSessions, SESSION_CLEANUP_TIMEOUT * 60 * 1000);



// Routes import
const authRouter = require('../../routes/auth.routes');
const companyRouter = require('../../routes/company.routes');
const homeRouter = require('../../routes/home.routes');
const timesheetRouter = require('../../routes/timesheet.routes');
const projectRouter = require('../../routes/project.routes');
const contactRouter = require('../../routes/contact.routes');
const reconcileRouter = require('../../routes/reconcile.routes');
const interactionRouter = require('../../routes/interaction.routes');
const notesRouter = require('../../routes/notes.routes');
const alertRouter = require('../../routes/alerts.routes');
const portfolioRouter = require('../../routes/portfolio.routes');
const documentRouter = require('../../routes/documents.routes');
const recentlyViewedRouter = require('../../routes/recentlyviewed.route');
const userRouter = require('../../routes/user.routes');
const caseRouter = require('../../routes/case.routes');
const surveyRouter = require('../../routes/survey.routes');
const assessmentRouter = require('../../routes/assessment.routes');
const sheetsRouter = require('../../routes/sheets.routes');
const projectSummaryRouter = require('../../routes/project-summary.routes');
const sqlAgentRouter = require('../../routes/sql-agent.routes');
// const advancedRAGChatRouter = require('../../routes/advanced-rag-chat.routes');

// Initialize database connection
require('../db/index');

// Routes declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/home", homeRouter);
app.use("/api/v1/timesheets", timesheetRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/contacts", contactRouter);
app.use("/api/v1/reconciliations", reconcileRouter);
app.use("/api/v1/interactions", interactionRouter);
app.use("/api/v1/notes", notesRouter);
app.use("/api/v1/alerts", alertRouter);
app.use("/api/v1/portfolios", portfolioRouter);
app.use("/api/v1/documents", documentRouter);
app.use("/api/v1/recently-viewed", recentlyViewedRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/case", caseRouter);
app.use("/api/v1/survey", surveyRouter);
app.use("/api/v1/assessment", assessmentRouter);
app.use("/api/v1/sheets", sheetsRouter);
app.use("/api/v1/project-summary", projectSummaryRouter);
app.use("/api/v1/sql-agent", sqlAgentRouter);
// app.use("/api/v1/advanced-rag", advancedRAGChatRouter);

module.exports = { app }
