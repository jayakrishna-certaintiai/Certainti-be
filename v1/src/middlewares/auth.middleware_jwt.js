const authQueries = require("../queries/auth.queries");
const { verifyAccessToken } = require("../utils/jwt");
const sessionService = require("../utils/sessionService");

const authorize_jwt = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(403).json({
                message: "Unauthorized",
                success: false,
            });
        }

        const jwt_token = authorization.split(' ')[1];
        const userId_jwt = verifyAccessToken(jwt_token);

        // Check if user exists in the system
        const userExists = await authQueries.getUserProfile(userId_jwt);
        if (!userExists) {
            return res.status(403).json({
                message: "Unauthorized",
                success: false,
            });
        } else if (userExists.hasPasswordChanged) {
            return res.status(403).json({
                message: "Unauthorized",
                success: false,
                logout: true,
            });
        }

        const sessionId = userId_jwt + jwt_token.substring(jwt_token.length - 7);

        // Check if session is valid
        if (sessionService.isSessionExpired(sessionId)) {
            sessionService.deleteSession(sessionId);
            return res.status(403).json({
                message: "Session expired due to inactivity",
                success: false,
                logout: true,
            });
        }

        // Update last activity time
        sessionService.createOrUpdateSession(sessionId, { userId: userId_jwt });

        // Retrieve user access and proceed
        const access = await authQueries.getUserAccess(userId_jwt);
        req.companyAccess = access.companyIds;
        req.userProfile = userExists;
        next();
    } catch (error) {
        return res.status(403).json({
            message: "Unauthorized",
            success: false,
            error: error.message,
        });
    }
};

module.exports = { authorize_jwt };
