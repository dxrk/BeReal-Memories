require("dotenv/config");

const signale = require("signale");
signale.config({
  displayTimestamp: true,
  displayDate: true,
  displayFilename: true,
});

const {
  USER_TOKEN = userToken,
  IFTTT_URL = iftttURL,
  IMGUR_CLIENT_ID = clientID,
  IMGUR_CLIENT_SECRET = clientSecret,
  IMGUR_REFRESH_TOKEN = refreshToken,
} = process.env;

const BeReal = require("./classes/BeReal.js");
const Notification = require("./classes/Notification.js");
const Merge = require("./classes/Merge.js");

// get current date for EST timezone
const date = new Date();
date.setHours(date.getHours() - 4);

// get date in format YYYY-MM-DD, including leading zeros
const today = date.toISOString().slice(0, 10);

const main = async () => {
  signale.start("Starting script");
  signale.info("Fetching memories");

  // wait for memories to return
  const memories = await BeReal.getMemories(USER_TOKEN);

  for (const memory of memories) {
    if (memory.date.slice(5, 10) === today.slice(5, 10)) {
      if (memory.date.slice(0, 4) !== today.slice(0, 4)) {
        signale.info("Found memory from today");
        signale.info("Merging images");
        const url = await Merge.start(
          memory.primary,
          memory.secondary,
          IMGUR_CLIENT_ID,
          IMGUR_CLIENT_SECRET,
          IMGUR_REFRESH_TOKEN
        );

        // date in format Friday, January 1, 2021
        const date = new Date(memory.date).toDateString();

        signale.info("Sending notification");
        await Notification.send(
          `⚠️ BeReal, One Year Ago Today ⚠️`,
          `Here's your BeReal memory from ${date}!`,
          url,
          IFTTT_URL
        );
      }
    }
  }
  // print return
};

main();
