class ApiResponse {
  constructor(data = null, message = "Success", success = true) {
    this.success = success; 
    this.message = message; 
    this.data = data;
  }
}

module.exports = { ApiResponse };
