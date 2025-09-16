const bcrypt = require("bcrypt");

async function createHashedPassword(password){
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

async function verifyHashedPassword(password, hashedPassword){
    // Check if the stored password is a bcrypt hash
    if (hashedPassword && hashedPassword.startsWith('$2b$')) {
        // Use bcrypt comparison for hashed passwords
        return await bcrypt.compare(password, hashedPassword);
    } else {
        // For plain text passwords stored in database, do direct comparison
        // This handles legacy users who have plain text passwords
        return password === hashedPassword;
    }
}

module.exports = { verifyHashedPassword, createHashedPassword }