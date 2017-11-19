const { Command } = require("discord.js-commando");
const config = require("../../config.js");
const authCheck = require("../../auth.js");
const saveConfig = require("../../saveConfig.js");
const logger = require("../../logger.js");

module.exports = class PrivacyCommand extends Command {
  constructor(client) {
    super(client, {
      name: "privacy",
      group: "util",
      memberName: "privacy",
      description: "set or check the time after which messages are deleted",
      args: [{
        key: "time",
        label: "time",
        prompt: "",
        type: "integer",
        default: ""
      }]
    });
  }

  run(message, args) {
    if (args.time && authCheck(message, 2, "set the privacy interval")) {
      if (args.time > 20000 || args.time < 1){
        logger.info(`${message.author.tag} tried to set the privacy interval to ${args.time}`);
        message.channel.send(`Cannot set privacy interval to ${args.time}`);
        return;
      }
      logger.info(`${message.author.tag} set the privacy interval to ${args.time}`);
      args.time *= 60000;
      config.cleanupTime = args.time;
      saveConfig(config);
    }
    message.channel.send(`Messages in this channel are removed after ${config.cleanupTime / 60000} minutes for privacy.`);
  }
};
