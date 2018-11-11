const readline = require("readline");
const fs = require("fs");
const getData = require("./helpers/getData.js");
const executeChild = require("./helpers/executeChild.js");
const os = process.platform;
let config;

/*
 * Starts the new server and handles housekeeping.
 * TODO: Check if EULA.txt exists, if not, start server, let it die, and replace EULA.
 * If it does, be sure its true and if not set it to true.
 * TODO: Restore local files from backup.
 * TODO: Restart the server with the latest version and fully backed up files.
*/

async function initializeServer() {
  try {
    await executeChild(`java -jar ${config.serverLocation}server.jar -nogui`, {
      cwd: `${config.serverLocation}`
    });
    let sedCommand;
    switch (os) {
      case "darwin":
        sedCommand = `sed -i "" "s/eula=false/eula=true/" ${
          config.serverLocation
        }eula.txt`;
        break;
      case "linux":
        sedCommand = `sed -i "s/eula=false/eula=true/" ${
          config.serverLocation
        }eula.txt`;
        break;
    }
    console.log("Accepting EULA...");
    await executeChild(sedCommand);
    console.log("Accepted EULA");
  } catch (e) {
    console.error(`Error initializing server! ${e}`);
  }
}

/*
 * Finds and downloads the latest jar from the server.
 * Kicks off an initialization of the new server.
*/
async function downloadLatestJar(latestFromServer, latestRelease) {
  const versionObject = latestFromServer.versions.find(
    version => version.id === latestRelease
  );
  try {
    const latestVersionUrl = await getData(versionObject.url);
    console.log(
      `Retrieving latest server jar from: ${
        latestVersionUrl.downloads.server.url
      }...`
    );
    await executeChild(
      `wget -O ${config.serverLocation}server.jar ${
        latestVersionUrl.downloads.server.url
      }`
    );
    console.log("Successfully retrieved latest jar.");
    console.log("Initializing server...");
    initializeServer();
  } catch (e) {
    console.error(e);
  }
}

/*
 * Checks if our environment variables have been set.
*/
function isFirstLaunch() {
  try {
    config = JSON.parse(fs.readFileSync("./config.json"));
    if (config.currentVersion && config.serverLocation) {
      return false;
    }
    return true;
  } catch (e) {
    console.error(`Error detected: ${e}`);
    return true;
  }
}

/**
 * Prompts our user for input based upon the provided question.
 * Optionally, allows our program to specify whether we wish to confirm or not.
 *
 * @param {*} question
 */
function askQuestion(question, shouldConfirm) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirm = () =>
    new Promise(resolve => {
      rl.question("Confirm? (y/n)", answer => {
        const answerLower = answer.toString().toLowerCase();
        if (answerLower === "y") {
          rl.close();
          resolve(true);
        } else {
          rl.close();
          resolve(askQuestion(question, confirm));
        }
      });
    });

  return new Promise(resolve => {
    rl.question(question, async answer => {
      if (shouldConfirm) {
        await confirm(answer);
      }
      resolve(answer);
      rl.close();
    });
  });
}

function setConfig(configObj) {
  if (config) {
    // edit config file, with line fullPath
    console.log("config exists, should be editing");
  } else {
    // create config file
    fs.writeFileSync("./config.json", JSON.stringify(configObj));
  }
}

/*
 * This function should back up any file that exists outside of server.jar
 * It should allow for a copy failure.
*/
function backupCurrent() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Backing up server data...");
      await (!fs.existsSync(`${config.serverLocation}backup`)
        ? executeChild(`mkdir ${config.serverLocation}/backup`)
        : undefined);
      await executeChild(
        `rsync -ax --exclude=${config.serverLocation}backup  --exclude=${
          config.serverLocation
        }server.jar ${config.serverLocation} ${config.serverLocation}backup`
      );
      console.log("Successfully backed up old files!");
      resolve();
    } catch (e) {
      reject(`Error backing up, ${e}`);
    }
  });
}

/*
 * Queries the server for the latest release version.
 * Compares to our current version and kicks off a new download if necessary.
*/
async function initialize() {
  if (isFirstLaunch()) {
    console.log(`Welcome to MinecraftUpdate for ${os}!`);
    console.log("This appears to be your first launch.");
    console.log("Please answer a few questions.");
    let serverLocation = await askQuestion(
      "Full path to server installation folder?",
      true
    );
    if (!serverLocation.endsWith("/")) {
      serverLocation += "/";
    }
    const currentVersion = await askQuestion(
      "Current version of server?",
      true
    );
    try {
      setConfig({ currentVersion, serverLocation });
      initialize();
    } catch (e) {
      console.error(e);
      console.error(
        `Error during initialization phase. ${e} Please try again.`
      );
    }
  } else {
    const URL = "https://launchermeta.mojang.com/mc/game/version_manifest.json";
    console.log(`Querying ${URL}...`);
    try {
      console.log(`Current version detected as ${config.currentVersion}`);
      const latestUpdate = await getData(URL);
      const latestRelease = latestUpdate.latest.release;
      console.log(`Latest Release: ${latestRelease}`);
      if (config.currentVersion === latestRelease) {
        console.log(
          "Current release and local version match. No need for updates at this time."
        );
        try {
          await backupCurrent();
        } catch (e) {
          console.error(e);
        }
        downloadLatestJar(latestUpdate, latestRelease);
      } else {
        console.warn(
          "Latest release and local version mismatch! Getting new server jar.."
        );
        /*
         * We should backup our local files before we begin downloading the latest jar.
         * This process should start here.
        */
        try {
          await backupCurrent();
        } catch (e) {
          console.error(e);
        }
        downloadLatestJar(latestUpdate, latestRelease);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

initialize();
