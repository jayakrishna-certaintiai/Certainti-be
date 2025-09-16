const users = async(userId) => {
    data = [
        {
            "id": "001",
            "name": "Certainti Admin"
        }
    ]

    const findUser = data.find(item => item.id === userId);

    return findUser;
}

module.exports = {
    users
}