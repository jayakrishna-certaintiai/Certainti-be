const createConstantValueArray = (len = 1, constant = null) => {
    const resArray = Array.from({ length: len }, () => constant);
    return resArray;
};

module.exports = createConstantValueArray