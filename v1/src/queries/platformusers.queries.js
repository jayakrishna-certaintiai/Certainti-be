const { Sequelize } = require("sequelize");
const sequelize = require("../setups/db");
const PlatformUsers = require("../models/platform-users.model");

const platformuserQueries = {
    updateOtpAndExpiry: async function (email, otp, expiryDate, cipher) {
        return PlatformUsers.update({
            otp: otp,
            otpExpiry: expiryDate,
            cipher: cipher,
            hasPasswordChanged: true
        }, {
            where: {
                email: email
            }
        });
    },

    updatepassword: async function (email, password) {
        return PlatformUsers.update({
            password: password,
        }, {
            where: {
                email: email
            }
        });
    },

    getOtpDetails: async function (email) {
        try {
            const user = await PlatformUsers.findOne({
                where: { email: email },
                attributes: ['otp', 'cipher']
            });

            return {
                status: true,
                data: {
                    storedOtp: user.otp,
                    storedCipher: user.cipher
                }
            };
        } catch (error) {
            console.error('Error fetching OTP details:', error);
            return { status: false, error: error.message };
        }
    }


}

module.exports = platformuserQueries