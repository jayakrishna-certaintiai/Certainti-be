const rateLimit = require('express-rate-limit');

const forgotPasswordLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per `window` (here, per hour)
    message: {
        message: "Too many requests, please try again after 30 mins.",
        success: false
    }
});

module.exports = forgotPasswordLimiter;