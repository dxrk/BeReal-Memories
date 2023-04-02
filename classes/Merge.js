const { Canvas, loadImage } = require("canvas");
const webp = require("webp-converter");
const { DownloaderHelper } = require("node-downloader-helper");
const path = require("path");
const fs = require("fs");
const signale = require("signale");
signale.config({
  displayTimestamp: true,
  displayDate: true,
  displayFilename: true,
});

const { ImgurClient } = require("imgur");

module.exports = {
  start: async (primary, secondary, clientId, clientSecret, refreshToken) => {
    const dir = path.join(__dirname, "../images");
    const primaryName = "primary-" + path.basename(primary);
    const secondaryName = "secondary-" + path.basename(secondary);

    function downloadImage(primaryOrSecondary, fileName, dir) {
      return new Promise((resolve, reject) => {
        const dl = new DownloaderHelper(primaryOrSecondary, dir, {
          fileName,
        });
        dl.on("download", (downloadInfo) =>
          signale.info("Downloading image: " + downloadInfo.fileName)
        );
        dl.on("end", () => {
          if (primaryOrSecondary.endsWith("webp")) {
            const convertedFileName = primaryOrSecondary.replace("webp", "jpg");
            webp.dwebp(primaryOrSecondary, convertedFileName, "-o", (err) => {
              if (err) {
                reject(err);
              } else {
                resolve(convertedFileName);
              }
            });
          } else {
            resolve(fileName);
          }
        });
        dl.on("error", (err) => reject(err));
        dl.start();
      });
    }

    const primaryFile = await downloadImage(primary, primaryName, dir);
    const secondaryFile = await downloadImage(secondary, secondaryName, dir);

    const primaryImage = await loadImage(path.join(dir, primaryFile));
    const secondaryImage = await loadImage(path.join(dir, secondaryFile));

    signale.info("Merging images");

    const canvasWidth = primaryImage.width;
    const canvasHeight = primaryImage.height;
    const canvas = new Canvas(canvasWidth, canvasHeight);

    const margin = 25;

    const secondaryImageWidth = 500;
    const secondaryImageHeight = 666.66666666666;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(primaryImage, 0, 0);

    const borderWidth = 10;
    const borderRadius = 25;
    const rectX = margin - borderWidth;
    const rectY = margin - borderWidth;
    const rectWidth = secondaryImageWidth + borderWidth * 2;
    const rectHeight = secondaryImageHeight + borderWidth * 2;

    createRoundRectPath(ctx, rectX, rectY, rectWidth, rectHeight, borderRadius);
    ctx.fillStyle = "black";
    ctx.fill();

    createRoundRectPath(
      ctx,
      margin,
      margin,
      secondaryImageWidth,
      secondaryImageHeight,
      borderRadius
    );
    ctx.clip();

    ctx.drawImage(
      secondaryImage,
      margin,
      margin,
      secondaryImageWidth,
      secondaryImageHeight
    );

    function createRoundRectPath(ctx, x, y, width, height, borderRadius) {
      ctx.beginPath();
      ctx.moveTo(x + borderRadius, y);
      ctx.lineTo(x + width - borderRadius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
      ctx.lineTo(x + width, y + height - borderRadius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - borderRadius,
        y + height
      );
      ctx.lineTo(x + borderRadius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
      ctx.lineTo(x, y + borderRadius);
      ctx.quadraticCurveTo(x, y, x + borderRadius, y);
      ctx.closePath();
    }

    const mergedImage = canvas.toDataURL("image/jpeg");

    const data = mergedImage.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(data, "base64");

    // get current date for EST timezone
    const date = new Date();
    date.setHours(date.getHours() - 4);

    // get date in format YYYY-MM-DD, including leading zeros
    const today = date.toISOString().slice(0, 10);

    const mergedPath = path.join(__dirname, "../images", `${today}-merged.jpg`);

    fs.writeFileSync(mergedPath, buf);

    signale.success("Merged images" + " " + mergedPath);

    function deleteImage(fileName) {
      fs.unlink(fileName, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    }

    try {
      deleteImage(path.join(dir, primaryFile));
      deleteImage(path.join(dir, secondaryFile));
      signale.success("Deleted primary and secondary images");
    } catch (error) {
      signale.error(error);
    }

    const client = new ImgurClient({
      clientId,
      clientSecret,
      refreshToken,
    });

    client.on("uploadProgress", (progress) => signale.info(progress));

    const response = await client.upload({
      image: fs.createReadStream(mergedPath),
      type: "file",
    });

    signale.success("Uploaded image to Imgur:", response.data.link);

    return response.data.link;
  },
};
