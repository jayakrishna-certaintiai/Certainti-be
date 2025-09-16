const authQueries = require("../queries/auth.queries");
const checkPermission = require("../middlewares/rbac.middleware");

const authorize = (featureIdentifier, permissionName) => {
    return async (req, res, next) => {
        try {
            const userId = req.userProfile.userId;
            const roleId = await authQueries.getRole(userId);
            const featureId = await authQueries.getFeature(featureIdentifier);
            const permissionId = await authQueries.getPermission(permissionName);

            const hasPermission = await checkPermission(roleId, featureId, permissionId);
            if (hasPermission) {
                next();
            } else {
                res.status(403).json({
                    message: "Forbidden",
                    success: false,
                });
            }
        } catch (error) {
            console.error(error);
            res.sendStatus(500); // Internal Server Error
        }
    };
};

module.exports = authorize;
