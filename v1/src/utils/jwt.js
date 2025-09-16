const jwt = require('jsonwebtoken');
const {ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, USER_ID_KEY, ACCESS_TOKEN_EXPIRY} = require("../constants"); 
const { decryptText } = require('./crypto');

const generateAccessToken = (id,email) => {
    return jwt.sign(
        {
            id,email
        },
        ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    )
};
  
const generateRefreshToken = (id,email) => {
    return jwt.sign(
        {
            id,email
        },
        REFRESH_TOKEN_SECRET,
        {
            expiresIn: "1y"
        }
    )
};
const verifyAccessToken = (accessToken) => {
    try {
        const payload = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
        const decrypt_userId = decryptText(payload.id, USER_ID_KEY );
        return(decrypt_userId);
      } catch (error) {
        res.status(401).json({
            status: 'fail',
            message: 'Unauthorized!',
          });
      }
};
const verifyRefreshToken = (refreshToken) => {
    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, payload) => {
        if (err) return reject(err);
        const userId = payload.id;
        resolve(userId);
        });
    });
};




module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken, verifyAccessToken }