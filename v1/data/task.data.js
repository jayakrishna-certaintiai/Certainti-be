const tasks = async(userId) => {
    data = [
      {
        userId: "001",
        timestamp: new Date("2024-04-01"),
        task: "General Notification",
      }
    ];

    const findTask = data.filter((item) => item.userId === userId);

    return findTask;
}

module.exports = {
    tasks
}