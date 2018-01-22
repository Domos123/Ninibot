const { Command } = require("discord.js-commando");
const authCheck = require("../../auth.js");
const logger = require("../../logger.js");

module.exports = class RestartCommand extends Command {
  constructor(client) {
    super(client, {
      name: "restart",
      group: "moderation",
      memberName: "restart",
      description: "Restart the bot"
    });
  }

  run(message, args) {
    if (!authCheck(message, 2, "restart me")) return;
    logger.warn(`Bot restarting on command from ${message.author.tag}`);
    message.channel.send("I'm restarting, be right back!")
    .then(process.exit(-1))
    .catch((err) => logger.error(`Error restarting: ${err.name} - ${err.message}`));
  }


};
