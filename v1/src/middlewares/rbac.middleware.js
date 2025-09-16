const authQueries = require('../queries/auth.queries');

const checkPermission = async (roleId, featureId, permissionId) => {
    try {
        const roleFeatureStatus = await authQueries.getRoleFeatureStatus(roleId, featureId, permissionId);
        return roleFeatureStatus === 1;
    } catch (error) {
        console.error(error);
        throw new Error('Error checking permission');
    }
};

module.exports = checkPermission;
