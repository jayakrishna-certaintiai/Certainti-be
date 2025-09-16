class ApiError {
  constructor(message = "Internal Server Error", code = 500, error = null) {
    this.success = false;
    this.error = {
      message,
      code,
    };
    this.timestamp = new Date().toISOString();
    this.stack = error ? error.stack : null
  }
}

module.exports = { ApiError };
