function transformData(input) {
    const { roleId, roleName, roleFeatures } = input;
    const transformed = {
        role: roleName,
        roleId: roleId,
        roleFeatures: [],
    };

    // Temporary object to hold the mapping between featureId and its index in transformed.roleFeatures
    const featureIndexMap = {};

    roleFeatures.forEach(feature => {
        const {
            featureId,
            featureTitle,
            permissionId,
            permissionIdentifier,
            permissionName,
            status,
        } = feature;
        // Check if this featureId already encountered
        if (featureIndexMap.hasOwnProperty(featureId)) {
            // If yes, add the new permission to the existing feature's permissions array
            transformed.roleFeatures[featureIndexMap[featureId]].permissions.push({
                permissionName: permissionName,
                permissionId: permissionId,
                status: status === 1, // convert status to boolean
            });
        } else {
            // If not, create a new entry for this feature and its first permission
            featureIndexMap[featureId] = transformed.roleFeatures.length; // Store the new feature's index
            transformed.roleFeatures.push({
                feature: featureTitle,
                featureId: featureId,
                permissions: [
                    {
                        permissionName: permissionName,
                        permissionId: permissionId,
                        status: status === 1, // convert status to boolean
                    },
                ],
            });
        }
    });

    return transformed;
}

module.exports = transformData;