const request = require("request-promise");

module.exports = {
  login: async (phoneNumber) => {
    // TODO: Add login with console inputs and save userToken to a file so it doesn't have to be entered every time and the bearer token can be used to get the user's memories
  },
  getMemories: async (userToken) => {
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

      return filteredMemories;
    } catch (error) {
      console.log(error);
    }
  },
};
