const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

// Make sure the key is 32 characters for aes-256-cbc
// You might need to adjust how you get or store this key
const ENCRYPTION_KEY = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'; // Default key if not in .env

// Function to encrypt text
const encryptText = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Function to decrypt text
const decryptText = (text) => {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// The 'encrypt' and 'decrypt' functions for numbers are just wrappers
// around the text versions. You can keep them if other parts of the code
// use them specifically.
const encrypt = (number) => {
    return encryptText(number.toString());
}

const decrypt = (ciphertext) => {
    return parseInt(decryptText(ciphertext));
}


module.exports = { encrypt, decrypt, encryptText, decryptText };
 