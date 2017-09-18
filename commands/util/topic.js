const { Command } = require("discord.js-commando");
const config = require("../../config.js");
const logger = require("../../logger.js");
module.exports = class PrivacyCommand extends Command {
  constructor(client) {
    super(client, {
      name: "topic",
      group: "util",
      memberName: "topic",
      description: "Check the current chat topic"
    });
  }

  run(message) {
    message.channel.send(config.topic).catch((err) => logger.error(err));
  }
};
