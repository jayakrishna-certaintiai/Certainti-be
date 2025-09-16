const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");
const getCurrentTimestampForMySQL = require("../utils/getCurrentTimestampForSQL");
const Users = require("../models/auth-users.model");
const PlatformUsers = require("../models/platform-users.model");
const Roles = require("../models/roles.model");
const RoleFeatures = require("../models/role-features.model");
const Features = require("../models/features.model");
const Permissions = require("../models/permissions.model");
//const Token = require('../models/token.model');
const transformData = require("../utils/transformJson");
const MasterCompanyMailConfiguration = require("../models/master-company-mail-configuration.model");
const { v4: uuidv4 } = require("uuid");
const { companyDefaultMailConfigurations } = require("../constants");


const authQueries = {

    getOrCreateLoginMailConfiguration: async function (feature, purpose) {
        try {

            let masterCompanyMailConfiguration = await MasterCompanyMailConfiguration.findOne({
                where: {
                    companyid: "ALL",
                    feature: feature,
                    purpose: purpose
                }
            });

            if (!masterCompanyMailConfiguration) {
                const subject = companyDefaultMailConfigurations[feature][purpose].subject;
                const body = companyDefaultMailConfigurations[feature][purpose].body;

                const masterCompanyMailConfigurationData = {
                    id: uuidv4(),
                    companyid: "ALL",
                    feature: feature,
                    purpose: purpose,
                    subject: subject,
                    body: body,
                }

                await MasterCompanyMailConfiguration.create(masterCompanyMailConfigurationData);
            }

            masterCompanyMailConfiguration = await MasterCompanyMailConfiguration.findOne({
                where: {
                    companyid: "ALL",
                    feature: feature,
                    purpose: purpose
                }
            });

            return masterCompanyMailConfiguration;
        } catch (error) {
            throw error;
        }
    },

    updateuserMfaSecret: async function (userEmail, mfa_secret) {
        await PlatformUsers.update(
            {
                MFA_SECRET: mfa_secret,
            },
            {
                where: {
                    email: userEmail
                }
            }
        );
    },
    updateuserMfaEnabled: async function (userEmail, mfa_enabled) {
        await PlatformUsers.update(
            {
                MFA_ENABLED: mfa_enabled,
            },
            {
                where: {
                    email: userEmail
                }
            }
        );
    }
    ,
    ifUserExists: async function (email) {
        const user = await PlatformUsers.findOne({
            where: {
                email
            }
        });
        if (!user) return { status: false }
        return { status: true, data: user };
    },
    getUserProfile: async function (userId) {
        const [data] = await sequelize.query(
            `
            SELECT 
                userId,
                roleId,
                sourceUserId,
                UserType,
                firstName,
                middleName,
                lastName,
                email,
                phone,
                userBaseRegion,
                userPreferedLanguage,
                userTimezone,
                isPassResetRequired,
                createdBy,
                modifiedBy,
                hasPasswordChanged
            FROM platformUsers
            WHERE userId = :userId
            `,
            {
                replacements: { userId },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        return data
    },
    getUserRoleDetails: async function (userId) {
        let final = []
        const [data] = await sequelize.query(
            `
            SELECT 
                userId,
                roleId,
                sourceUserId,
                UserType,
                firstName,
                middleName,
                lastName,
                email,
                phone,
                userBaseRegion,
                userPreferedLanguage,
                userTimezone,
                isPassResetRequired,
                createdBy,
                modifiedBy
            FROM platformUsers
            WHERE userId = :userId
            `,
            {
                replacements: { userId },
                type: Sequelize.QueryTypes.SELECT,
            }
        );

        userId = data?.userId

        let roleId = data?.roleId

        const roleDetails = await sequelize.query(
            `
            SELECT rf.*, f.featureIdentifier, f.description, p.permissionIdentifier, ro.role
            FROM RoleFeatures rf
            LEFT JOIN Features f ON rf.featureId = f.featureId
            LEFT JOIN permissions p ON p.permissionId = rf.permissionId
            LEFT JOIN Roles ro ON ro.roleId = rf.roleId
            WHERE rf.roleId = :roleId
            `,
            {
                replacements: { roleId },
                type: Sequelize.QueryTypes.SELECT
            }
        );
        return { userInfo: data, rolesInfo: roleDetails };
    },
    getUserAccess: async function (userId) {
        const [data] = await sequelize.query(
            `
            SELECT 
                JSON_ARRAYAGG(ucr.companyId) AS companyIds
            FROM User_Company_Relations ucr
            WHERE userId = :userId;
            `,
            {
                replacements: { userId },
                type: Sequelize.QueryTypes.SELECT
            }
        );

        return data
    },
    getNewPassword: async function (newPassword, email) {
        const data = await PlatformUsers.update({
            isPassResetRequired: 1,
            password: newPassword
        }, {
            where: {
                email
            }
        });
        return data;
    },
    createNewUserRole: async function (body) {
        const body1 = {
            roleName: "test",
            description: "Description for new role.",
            createdBy: "Raunak",
            modifiedBy: "Raunak",
            featurePermissions: [
                {
                    featureId: "F004",
                    permissionId: "P001",
                    status: 0
                },
                {
                    featureId: "F003",
                    permissionId: "P001",
                    status: 1
                },
                {
                    featureId: "F005",
                    permissionId: "P009",
                    status: 1
                }
            ]
        }
        const data = await Roles.create({
            role: body.roleName,
            statusDate: getCurrentTimestampForMySQL(),
            description: body.description,
            createdBy: body.createdBy,
            modifiedBy: body.modifiedBy
        });
        if (data.roleId) {
            body.featurePermissions = body.featurePermissions.map((p) => {
                let permission = { ...p }
                permission.roleId = data.roleId;
                permission.createdBy = body.createdBy;
                permission.modifiedBy = body.modifiedBy;
                permission.statusDate = getCurrentTimestampForMySQL();
                return permission
            });
            const createRoleFeatures = await RoleFeatures.bulkCreate(body.featurePermissions)
        }
        return data;
    },
    getFeaturesList: async function () {
        const data = await Features.findAll({
            attributes: ['featureId', 'featureIdentifier', 'featureTitle']
        });
        return data
    },
    getPermissionsList: async function () {
        const data = await Permissions.findAll({
            attributes: ['permissionId', 'permissionIdentifier', 'permissionName']
        });
        return data;
    },
    getRoleDetails: async function () {
        let data = []
        const roles = await Roles.findAll({
            attributes: ['roleId', 'role', 'description']
        });
        for (let role of roles) {
            let roleId = role.roleId;

            const roleFeatures = await sequelize.query(
                `
                    SELECT rf.roleFeaturesId, rf.featureId, rf.permissionId, rf.status, f.featureIdentifier, f.featureTitle, f.description, p.permissionIdentifier, p.permissionName
                    FROM RoleFeatures rf
                    LEFT JOIN Features f ON rf.featureId = f.featureId
                    LEFT JOIN permissions p ON p.permissionId = rf.permissionId
                    WHERE rf.roleId = :roleId 
                    ORDER BY rf.featureId
                `,
                {
                    replacements: { roleId },
                    type: Sequelize.QueryTypes.SELECT
                }
            );

            data.push({
                roleId: roleId,
                roleName: role.role,
                description: role.description,
                roleFeatures: roleFeatures,
            })
        }

        let result = []

        for (let input of data) {
            result.push(transformData(input))
        }

        return result
    },
    getRole: async function (userId) {
        const [user] = await sequelize.query(
            `SELECT roleId FROM platformUsers WHERE userId = :userId`,
            {
                replacements: { userId },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Check if user exists
        if (user && user.roleId) {
            return user.roleId;
        } else {
            // Handle case where user does not exist
            throw new Error('User not found');
        }
    },
    getFeature: async function (featureIdentifier) {
        const [feature] = await sequelize.query(
            `SELECT featureId FROM features WHERE featureIdentifier = :featureIdentifier`,
            {
                replacements: { featureIdentifier },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Check if feature exists
        if (feature && feature.featureId) {
            return feature.featureId;
        } else {
            // Handle case where feature does not exist
            throw new Error('Feature not found');
        }
    },
    getPermission: async function (permissionIdentifier) {
        const [permission] = await sequelize.query(
            `SELECT permissionId FROM permissions WHERE permissionIdentifier = :permissionIdentifier`,
            {
                replacements: { permissionIdentifier },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Check if feature exists
        if (permission && permission.permissionId) {
            return permission.permissionId;
        } else {
            // Handle case where feature does not exist
            throw new Error('Permission not found');
        }
    },

    getRoleFeatureStatus: async function (roleId, featureId, permissionId) {
        const [roleFeatureStatus] = await sequelize.query(
            `SELECT status FROM roleFeatures WHERE roleId = :roleId AND featureId = :featureId AND permissionId = :permissionId`,
            {
                replacements: { roleId, featureId, permissionId },
                type: sequelize.QueryTypes.SELECT
            }
        );

        // Check if the status exists
        if (roleFeatureStatus && roleFeatureStatus.status !== undefined) {
            return roleFeatureStatus.status;
        } else {
            // Handle case where the record does not exist
            throw new Error('Role feature status not found');
        }
    },
    createUser: async function (userEmail) {
        // Fetch the email from the userData
        // const email = userData.email;
        console.log("Extracted email:", userEmail);
        // If user doesn't exist, create a new user
        const newUser = await PlatformUsers.create({
            userId: uuid(), // Generate a UUID for userId
            email: userEmail,
            password: null, // Password is null
            UserType: 'External User', // Set UserType as External User
            sourceUserId: null, // sourceUserId is null
            roleId: 'R00000002', // Set roleId to R00000002
            firstName: null, // firstName is null
            middleName: null, // middleName is null
            lastName: null, // lastName is null
            description: null, // description is null
            phone: null, // phone is null
            userBaseRegion: null, // userBaseRegion is null
            userPreferedLanguage: null, // userPreferedLanguage is null
            userTimezone: null, // userTimezone is null
            status: 'active', // You can default this to 'active'
            statusDate: new Date(), // Set statusDate to current date
            isPassResetRequired: null, // isPassResetRequired is null
            roleAssignDate: null, // roleAssignDate is null
            createdBy: 'system', // Set createdBy to 'system' or any user
            createdTime: new Date(), // Set createdTime to current date
            modifiedBy: null, // modifiedBy is null
            modifiedTime: null, // modifiedTime is null
            sysModTime: new Date(), // Set sysModTime to current date
            pin: 'CLNT:ALL|CONT:ALL|PORT:ALL|PROJ:ALL|AI:ALL|TIMESHEETS:ALL|WB:ALL', // Set pin as specified
            MFA_SECRET: null, // MFA_SECRET is null
            MFA_ENABLED: 0, // Set MFA_ENABLED to 0 (false)
            isMfaRequired: 1, // Set isMfaRequired to 1 (true)
            otpExpiry: null, // otpExpiry is null
            otp: null, // otp is null
            cipher: null, // cipher is null
            hasPasswordChanged: 0, // Set hasPasswordChanged to 0 (false)
            source: 'IDP' // Set source to IDP
        });

        return newUser; // Return the newly created user
    }



};

module.exports = authQueries;


/*

result to be achieved = {
    role: role,
    roleId: roleId,
    roleFeatures: [
        {
            feature: featureName,
            featureId: aaa,
            permissions: [
                {
                    permissionName: Per1,
                    permissionId: P001,
                    status: true
                },
                {
                    permissionName: Per2,
                    permissionId: P002,
                    status: false
                }
            ]
        },
        {
            feature: featureName,
            featureId: bbb,
            permissions: [
                {
                    permissionName: Per1,
                    permissionId: P001,
                    status: true
                },
                {
                    permissionName: Per2,
                    permissionId: P002,
                    status: false
                }
            ]
        },

    ]
}

let ff = []
for (let role of roles){
    against each role find rfs entries with distinct feature name
    var rfs = select distinct rf.featureName, rf.featureId

    for(rf of rfs){
        var prarr = select status, permissionId, perName from rfs join permission where roleId = roleId and featureId
        rf.permissions.push(prarr)
    }

    ff.push()

}




*/