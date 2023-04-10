const request = require("request-promise");
const signale = require("signale");
signale.config({
  displayTimestamp: true,
  displayDate: true,
  displayFilename: true,
});

module.exports = {
  login: async (phoneNumber) => {
    const options = {
      method: "POST",
      uri: "https://us-central1-befake-623af.cloudfunctions.net/login",
      body: `{"phoneNumber":"${phoneNumber}"}`,
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "text/plain;charset=UTF-8",
        "sec-ch-ua":
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
      },
    };

    const response = await request(options);

    if (JSON.parse(response).error) {
      signale.error("Too many requests, please try again later.");
      process.exit(1);
    }

    const sessionInfo = JSON.parse(response).sessionInfo;
    return sessionInfo;
  },
  verify: async (sessionInfo, code) => {
    const options = {
      method: "POST",
      uri: "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPhoneNumber?key=AIzaSyDwjfEeparokD7sXPVQli9NsTuhT6fJ6iA",
      body: `{"sessionInfo":"${sessionInfo}","code":"${code}","operation":"SIGN_UP_OR_IN"}`,
    };

    try {
      const response = await request(options);
      const userToken = JSON.parse(response).idToken;
      const refreshToken = JSON.parse(response).refreshToken;

      return [userToken, refreshToken];
    } catch (error) {
      return false;
    }
  },
  refresh: async (refreshToken) => {
    signale.info("Refreshing token...");
    const options = {
      method: "POST",
      uri: "https://securetoken.googleapis.com/v1/token?key=AIzaSyDwjfEeparokD7sXPVQli9NsTuhT6fJ6iA",
      body: `{"grant_type":"refresh_token","refresh_token":"${refreshToken}"}`,
    };

    try {
      const response = await request(options);
      const userToken = JSON.parse(response).id_token;
      signale.success("Token refreshed!");

      const config = require("../config.json");
      config.BEREAL.USER_TOKEN = userToken;

      const fs = require("fs");
      fs.writeFileSync(
        "../config.json",
        JSON.stringify(config, null, 2),
        "utf8"
      );

      return userToken;
    } catch (error) {
      signale.error("Error while refreshing token. Ending process...");
      process.exit(1);
    }
  },
  getMemories: async (userToken, refreshToken) => {
    const options = {
      method: "GET",
      uri: "https://mobile.bereal.com/api/feeds/memories",
      headers: {
        "user-agent": "BeReal/0.35.0 (iPhone; iOS 16.0.2; Scale/2.00)",
        "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
        authorization: userToken,
      },
      json: true,
    };

    try {
      const response = await request(options);
      let filteredMemories = [];
      const res = response["data"];

      for (let i in res) {
        filteredMemories.push({
          id: res[i]["id"],
          primary: res[i]["primary"]["url"],
          secondary: res[i]["secondary"]["url"],
          date: res[i]["memoryDay"],
        });
      }

      return {
        memories: filteredMemories,
        userToken: userToken,
        refreshToken: refreshToken,
      };
    } catch (error) {
      if (error.statusCode == 403) {
        const userToken = await module.exports.refresh(refreshToken);
        return module.exports.getMemories(userToken, refreshToken);
      } else {
        return false;
      }
    }
  },
};
