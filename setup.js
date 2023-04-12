const fs = require("fs");
const path = require("path");
const input = require("input");
const signale = require("signale");
signale.config({
  displayTimestamp: true,
  displayDate: true,
  displayFilename: true,
});

async function checkFiles() {
  if (!fs.existsSync(path.join(__dirname, "config.json"))) {
    fs.writeFileSync(
      path.join(__dirname, "config.json"),
      JSON.stringify({
        BEREAL: {
          USER_TOKEN: "",
          REFRESH_TOKEN: "",
        },
        IMGUR: {
          CLIENT_ID: "",
          CLIENT_SECRET: "",
          REFRESH_TOKEN: "",
        },
        IFTTT: {
          URL: "",
        },
      })
    );
  }

  if (!fs.existsSync(path.join(__dirname, "images"))) {
    fs.mkdirSync(path.join(__dirname, "images"));
  }

  if (
    fs.existsSync(path.join(__dirname, "config.json")) &&
    fs.existsSync(path.join(__dirname, "images"))
  ) {
    await endSetup();
  }
}

async function endSetup() {
  const runNow = await input.confirm("Would you like to run the script now?");

  if (runNow) {
    const package = require("./package.json");
    package.scripts.start = "node index.js";
    package.main = "index.js";
    fs.writeFileSync(
      path.join(__dirname, "package.json"),
      JSON.stringify(package)
    );
    require("./index");
  } else {
    signale.success("Setup complete, run index.js to start the script");
  }
}

async function updateConfig(type, node, data) {
  const config = require("./config.json");
  config[type][node] = data;

  fs.writeFile("./config.json", JSON.stringify(config), (err) => {
    if (err) console.log(err);
  });
}

const main = async () => {
  await checkFiles();

  const BeReal = require("./classes/BeReal");

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

    await updateConfig("BEREAL", "USER_TOKEN", req[0]);
    await updateConfig("BEREAL", "REFRESH_TOKEN", req[1]);

    verified = true;
    signale.success("Logged in to BeReal successfully");
  }

  const url = await input.text(
    "Enter your IFTTT webhook URL (Tutorial, check README for settings: https://sungkhum.medium.com/how-to-easily-push-notifications-to-your-phone-from-a-micropython-device-21d39968e05c): "
  );
  await updateConfig("IFTTT", "URL", url);
  signale.success("IFTTT webhook URL set to:", url);

  const clientId = await input.text("Enter your Imgur client ID: ");
  await updateConfig("IMGUR", "CLIENT_ID", clientId);
  signale.success("Imgur client ID set to:", clientId);

  const clientSecret = await input.text("Enter your Imgur client secret: ");
  await updateConfig("IMGUR", "CLIENT_SECRET", clientSecret);
  signale.success("Imgur client secret set to:", clientSecret);

  const refreshToken = await input.text("Enter your Imgur refresh token: ");
  await updateConfig("IMGUR", "REFRESH_TOKEN", refreshToken);
  signale.success("Imgur refresh token set to:", refreshToken);

  await endSetup();
};

main();
