const { Sequelize, Op } = require("sequelize");
const sequelize = require("../setups/db");
const { v4: uuidv4 } = require('uuid');
const PlatformUsers = require("../models/platform-users.model");
const User_Company_Relations = require("../models/user-company-relations.model");

const user = {
    getPlatformUserList: async function () {
        const data = PlatformUsers.findAll({
            attributes: { exclude: ['password', "MFA_ENABLED", "isMfaRequired", "MFA_SECRET", "otpExpiry", "otp", "cipher", "isPassResetRequired", "phone", "pin"] },
            where: {
                "status": "active"
            }
        });

        console.log(data);
        return data
    },
    getPlatformUserDetails: async function (usersList) {
        const data = PlatformUsers.findAll({
            where: {
                userId: usersList
            },
            attributes: { exclude: ['password', "MFA_ENABLED", "isMfaRequired", "MFA_SECRET", "otpExpiry", "otp", "cipher", "isPassResetRequired", "phone", "pin"] },
        })
        return data;
    },
    editPlatformUserDetails: async function (userId, body) {
        if (body.password) {
            return new Error('Password Cannot be modified using edit users.')
        }
        const data = await PlatformUsers.update(body, {
            where: {
                userId
            }
        });
        if (body.company) {
            let relations = body.company.map(company => ({
                companyId: company,
                userId,
                createdBy: user,
            }));
            await User_Company_Relations.bulkCreate(relations);
        }
        return data;
    },
    createPlatformUser: async function (user, body) {
        let userId = uuidv4().split('-').join('');
        const data = await PlatformUsers.create({
            userId,
            UserType: body.UserType,
            sourceUserId: body.sourceUserId,
            firstName: body.firstName,
            middleName: body.middleName,
            lastName: body.lastName,
            email: body.email,
            phone: body.phone,
            roleId: body.roleId,
            password: body?.password,
            description: body.description,
            userBaseRegion: body.userBaseRegion ? body.userBaseRegion : "",
            userPreferedLanguage: body.userPreferedLanguage ? body.userPreferedLanguage : "",
            userTimezone: body.userTimezone ? body.userTimezone : "",
            isPassResetRequired: 0,
            createdBy: user,
            status: 'active',
            statusDate: new Date(Date.now()),
            lastLogin: new Date(Date.now()),
            roleAssignDate: new Date(Date.now()),
            pin: "CLNT:ALL|CONT:ALL|PORT:ALL|PROJ:ALL|AI:ALL|TIMESHEETS:ALL|WB:OPEN"
        });

        let relations = body.company.map(company => ({
            companyId: company,
            userId,
            createdBy: user,
        }))
        await User_Company_Relations.bulkCreate(relations);
        return data
    },
    deletePlatFormUser: async function (userId) {
        const data = await PlatformUsers.update({
            "status": "inactive"
        }, {
            where: {
                userId
            }
        });
        return data;
    }


}

module.exports = user;