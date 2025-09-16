const { v4: uuidv4 } = require('uuid');

const generateUUIDWithoutHyphen = () => {
    const uuid = uuidv4(); // Generate UUID with hyphens
    const uuidWithoutHyphen = uuid.replace(/-/g, ''); // Remove hyphens
    console.log(uuidWithoutHyphen);
    return uuidWithoutHyphen; // Return 32 character UUID
};
module.exports = generateUUIDWithoutHyphen;