require("dotenv/config");

const signale = require("signale");
signale.config({
  displayTimestamp: true,
  displayDate: true,
  displayFilename: true,
});

const { USER_TOKEN = userToken } = process.env;

const Memories = require("./classes/Memories.js");
const SendNotification = require("./classes/SendNotification.js");

const date = new Date();

// get date in format YYYY-MM-DD, including leading zeros
const today = date.toISOString().slice(0, 10);

const main = async () => {
  signale.start("Starting script");
  signale.info("Fetching memories");
  const memories = await Memories.get(USER_TOKEN);
  signale.info("Memories fetched");
  // print return
  console.log(memories);
};

main();
