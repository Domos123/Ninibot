const { Command } = require("discord.js-commando");
const config = require("../../config.js");
const authCheck = require("../../auth.js");
const saveConfig = require("../../saveConfig.js");
const logger = require("../../logger.js");

module.exports = class SetTopicCommand extends Command {
  constructor(client) {
    super(client, {
      name: "settopic",
      group: "moderation",
      memberName: "settopic",
      description: "set the topic for discussion",
      args: [
        {
          key: "topic",
          prompt: "What would you like to set the topic of the chat to?",
          type: "string"
        }
      ]
    });
  }

  run(message, args) {
    if (!authCheck(message, 2, "set the topic")) return;
    config.topic = args.topic;
    saveConfig(config);
    logger.info(`${message.author.tag} set the topic to "${config.topic}"`);
    message.channel.send(`Set topic to "${config.topic}"`).catch((err) => logger.error(`Error sending message: ${err.name} - ${err.message}`));
  }


};
