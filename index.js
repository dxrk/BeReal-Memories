const signale = require("signale");
signale.config({
  displayTimestamp: true,
  displayDate: true,
  displayFilename: true,
});

const fs = require("fs");
const config = require("./config.json");

const BeReal = require("./classes/BeReal.js");
const Notification = require("./classes/Notification.js");
const Merge = require("./classes/Merge.js");
const input = require("input");

const date = new Date();
date.setHours(date.getHours() - 4);

const today = date.toISOString().slice(0, 10);

async function updateConfig(token, refreshToken) {
  config.BEREAL.USER_TOKEN = token;
  config.BEREAL.REFRESH_TOKEN = refreshToken;

  fs.writeFile("./config.json", JSON.stringify(config), (err) => {
    if (err) console.log(err);
  });
}

const main = async () => {
  signale.start("Starting script");

  if (config.BEREAL.USER_TOKEN === "" || config.BEREAL.REFRESH_TOKEN === "") {
    signale.info("No user token found, logging in");

    const phone = await input.text(
      "Enter your phone number with country code (ex. +14439002423): "
    );
    const sessionInfo = await BeReal.login(phone);

    let verified = false;
    while (!verified) {
      const code = await input.text("Enter the code you received: ");

      const req = await BeReal.verify(sessionInfo, code);
      if (!req) {
        signale.error("Invalid code, please try again");
        continue;
      }

      await updateConfig(req[0], req[1]);

      verified = true;
      signale.success("Logged in successfully");
    }
  } else {
    signale.info("User token found, skipping login");
  }

  signale.info("Fetching memories");

  const memories = await BeReal.getMemories(
    config.BEREAL.USER_TOKEN,
    config.BEREAL.REFRESH_TOKEN
  );

  await updateConfig(memories.userToken, memories.refreshToken);

  for (const memory of memories.memories) {
    if (memory.date.slice(5, 10) === today.slice(5, 10)) {
      if (memory.date.slice(0, 4) !== today.slice(0, 4)) {
        signale.info("Found memory from today");
        signale.info("Merging images");
        const url = await Merge.start(
          memory.primary,
          memory.secondary,
          config.IMGUR.CLIENT_ID,
          config.IMGUR.CLIENT_SECRET,
          config.IMGUR.REFRESH_TOKEN
        );

        const date = new Date(memory.date).toDateString();

        signale.info("Sending notification");
        await Notification.send(
          `⚠️ BeReal, One Year Ago Today ⚠️`,
          `Here's your BeReal memory from ${date}!`,
          url,
          config.IFTTT.URL
        );
        signale.success("Notification sent! Waiting until tomorrow!");
      }
    }
  }
};

const schedule = require("node-schedule");
let rule = new schedule.RecurrenceRule();

rule.tz = "America/New_York";
rule.hour = 8;
rule.minute = 0;

signale.start("Running script every day at 8am EST");
schedule.scheduleJob(rule, main);
