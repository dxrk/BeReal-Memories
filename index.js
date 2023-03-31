require("dotenv/config");

const signale = require("signale");
signale.config({
  displayTimestamp: true,
  displayDate: true,
  displayFilename: true,
});

const mergeImages = require("merge-images-v2");
const { Canvas, loadImage } = require("canvas");
const webp = require("webp-converter");
const fetch = require("node-fetch");
const fs = require("fs");

const { USER_TOKEN = userToken } = process.env;

const Memories = require("./classes/Memories.js");
const SendNotification = require("./classes/SendNotification.js");

// get current date for EST timezone
const date = new Date();
date.setHours(date.getHours() - 4);

// get date in format YYYY-MM-DD, including leading zeros
const today = date.toISOString().slice(0, 10);

const main = async () => {
  signale.start("Starting script");
  signale.info("Fetching memories");

  // wait for memories to return
  const memories = await Memories.get(USER_TOKEN);

  for (const memory of memories) {
    if (memory.date.slice(5, 10) === today.slice(5, 10)) {
      if (memory.date.slice(0, 4) !== today.slice(0, 4)) {
        signale.info("Found memory from today");
        signale.info("Merging images");

        console.log(memory.primary);
        console.log(memory.secondary);

        // if the images end with jpg, then they are already in jpg format
        // if they end with webp, then they need to be converted to jpg
        // if they end with png, then they need to be converted to jpg

        await fetch(memory.primary).then((response) => {
          if (memory.primary.endsWith("jpg")) {
            filePath = `./primary.jpg`;
          } else {
            filePath = `./primary-bare.webp`;
          }

          const dest = fs.createWriteStream(filePath);
          response.body.pipe(dest);
        });

        await fetch(memory.secondary).then((response) => {
          if (memory.secondary.endsWith("jpg")) {
            filePath = `./secondary.jpg`;
          } else {
            filePath = `./secondary-bare.webp`;
          }

          const dest = fs.createWriteStream(filePath);
          response.body.pipe(dest);
        });

        if (memory.primary.endsWith("webp")) {
          const primary = await webp.dwebp(
            "primary-bare.webp",
            "primary.jpg",
            "-o"
          );
        }

        if (memory.secondary.endsWith("webp")) {
          const secondary = await webp.dwebp(
            "secondary-bare.webp",
            "secondary.jpg",
            "-o"
          );
        }

        const primaryImage = await loadImage("primary.jpg");
        const secondaryImage = await loadImage("secondary.jpg");

        // Set canvas size
        const canvasWidth = primaryImage.width;
        const canvasHeight = primaryImage.height;
        const canvas = new Canvas(canvasWidth, canvasHeight);

        // Set margin and size of secondary image
        const margin = 10;

        // Set size of secondary image to 10x less than primary image
        const secondaryImageWidth = 500;
        const secondaryImageHeight = 666.66666666666;

        // Draw primary image on canvas
        const ctx = canvas.getContext("2d");
        ctx.drawImage(primaryImage, 0, 0);

        // Draw secondary image on canvas with margin
        ctx.drawImage(
          secondaryImage,
          margin,
          margin,
          secondaryImageWidth,
          secondaryImageHeight
        );

        // Convert canvas to image
        const mergedImage = await canvas.toDataURL("image/jpeg");

        // Save image
        const data = mergedImage.replace(/^data:image\/\w+;base64,/, "");
        const buf = Buffer.from(data, "base64");
        fs.writeFileSync("merged.jpg", buf);

        // signale.info("Sending notification");
        // await SendNotification.send(
        //   "Memory from today",
        //   "https://maker.ifttt.com/trigger/memory/with/key/" +
        //     process.env.IFTTT_KEY,
        //   "https://www.bereal.com",
        //   "memory"
        // );
        // signale.success("Done");
      }
    }
  }
  // print return
};

main();
