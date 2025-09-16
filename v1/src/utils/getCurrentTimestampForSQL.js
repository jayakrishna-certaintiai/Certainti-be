function getCurrentTimestampForMySQL() {
    let now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' '); // Formats the timestamp in YYYY-MM-DD HH:MM:SS format
}

module.exports = getCurrentTimestampForMySQL;