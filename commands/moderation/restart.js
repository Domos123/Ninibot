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
    message.channel.send("I'm restarting, be right back!").catch((err) => logger.error(err));
    logger.warn(`Bot restarting on command from ${message.author.tag}`);
    process.exit(-1);
  }


};
