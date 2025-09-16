const axios = require("axios");

const axiosRequest = async (method, url, body) => {
  try {
    var config = {
      method: method,
      url: url,
      headers: {
        "Content-Type": "application/json",
      },
      data: body ? JSON.stringify(body) : undefined,
    };

    var response = await axios(config);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

module.exports = { axiosRequest }