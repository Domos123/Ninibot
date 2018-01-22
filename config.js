const fs = require("fs");
const logger = require("./logger.js");
//Config in case none is present
let initConfig = ( () => {
  config = {
    token: "put your token here",
    ownerID: "ID of whoever will run the bot",
    prefix: "!",
    mainChannel: "The channel id to delete things from",
    backupChannel: "The channel id to back deleted things up in",
    cleanupTime: 60000,
    roles: [
      {id: "admin id here", rank: 0},
      {id: "second role id here", rank: 1},
      {id: "third role id here", rank: 2}
    ],
    topic: "No topic set",
    lastMessageAt: 0};
  //Have to syncronous write so we don't quit before we save
  fs.writeFileSync("./config.json", JSON.stringify(config,null,2), "utf8", (err) => {if (err) logger.error(`Error writing default config: ${err.name} - ${err.message}`);});
  logger.warn("Config was not found or malformed. Set up default config. Please configure then restart");
  process.exit(1);
});

var config;
//Load config, or if we can't, set one up and quit
try {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
} catch (err) {
  initConfig();
}

module.exports = config;
