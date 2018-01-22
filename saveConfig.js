const fs = require("fs");
const logger = require("./logger.js");
//save config
module.exports =( (config) => {
  fs.writeFile("./config.json", JSON.stringify(config,null,2), "utf8", (err) => {if (err) logger.error(`Error saving config: ${err.name} - ${err.message}`);});
});
