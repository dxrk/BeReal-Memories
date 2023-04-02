const request = require("request-promise");

module.exports = {
  send: async (title, text, imageLink, url) => {
    request({
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      url,
      json: true,
      body: {
        value1: title,
        value2: text,
        value3: imageLink,
      },
    });
  },
};
