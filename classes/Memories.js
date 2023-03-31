const request = require("request-promise");
const signale = require("signale");

module.exports = {
  get: async (userToken) => {
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

    request(options)
      .then((response) => {
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
      })
      .catch((error) => {
        signale.error("Error fetching memories");
        console.log(error);
      });
  },
};
