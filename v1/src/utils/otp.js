const generateOtp = async (length, alphanumeric) => {
    let characters;

    if (alphanumeric == true) {
        characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    } else {
        characters = '0123456789';
    }

    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return otp;
}



module.exports = { generateOtp };