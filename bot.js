const Commando = require("discord.js-commando");
const RichEmbed = require("discord.js").RichEmbed;
const path = require("path");
const config = require("./config.js");
const saveConfig = require("./saveConfig.js");
const authCheck = require("./auth.js");
const logger = require("./logger.js");

//No more including version number in config <3
require("pkginfo")(module);

logger.info("Starting Bot");

const client = new Commando.Client({owner: config.ownerID, commandPrefix: config.prefix});

//Set up command categories
client.registry
  .registerGroups([
    ["util", "utility and informational commands"],
    ["moderation", "commands for moderation"]
  ])
  .registerDefaults()
  .registerCommandsIn(path.join(__dirname, "commands"));

//Log in to Discord
client.login(config.token);

//Delete old messages
let cleanup = ( () => {
  let mainchat = client.channels.get(config.mainChannel);
  let backuproom = client.channels.get(config.backupChannel);

  //If we process more than 100, we should do it again to make sure we got everything
  let count = 0;

  mainchat.fetchMessages({limit:100})
          .then(messages => {
            let messagesArr = messages.array();
            let messageCount = messagesArr.length;

            for(let i = messageCount - 1; i >= 0; i--) {
              if (Date.now() - messagesArr[i].createdAt < config.cleanupTime) return;
              const embed = new RichEmbed()
                .addField("​",messagesArr[i].cleanContent)
                .setFooter(messagesArr[i].author.tag)
                .setColor(messagesArr[i].member?messagesArr[i].member.displayHexColor:0xaaaaaa)
                .setTimestamp(messagesArr[i].createdAt)
                .setAuthor(messagesArr[i].member?messagesArr[i].member.displayName:messagesArr[i].author.username, messagesArr[i].author.avatarURL);
              backuproom.send({embed}).catch( (err) => logger.error(err));
              messagesArr[i].delete()
                .then(() => {
                  count += 1;
                  if(count >= 100) {
                    cleanup();
                  }
                })
                .catch((err) => {
                  logger.error(err);
                  count += 1;
                  if(count >= 100) {
                    cleanup();
                  }
                });
            }
          })
          .catch((err) => logger.error(err));
});

//When the bot has logged in to Discord
client.on("ready", () => {
  logger.info(`Bot Ready - ${module.exports.name} - ${module.exports.version}`);
  client.user.setGame(config.game);

  setInterval(cleanup, 30000);
});

//Handle messages
client.on("message", (message) => {

  let command = message.content.toLowerCase().split(" ")[0].slice(1);

  //Get info about bot
  if (command === "about"){
    message.channel.send(`Hi, I'm ${module.exports.name} ${module.exports.version}.\nI was created by ${module.exports.author.name} and can be found at ${module.exports.homepage} or on npm.`);
  }

  //Get Weekly Topic
  if (command === "topic"){
    message.channel.send(config.topic).catch((err) => logger.error(err));
  }

  //Set User Nickname (eg. to add pronouns)
  if (command === "nick"){
    let userNick = message.content.slice(message.content.indexOf(" ")+1);
    if (userNick == config.prefix + command){
      message.channel.send("Expected 1 argument - nickname to set");
      return;
    }
    logger.info(`Setting nickname for "${message.member.user.tag}" to "${userNick}"`);
    message.member.setNickname(userNick).then().catch((err) => logger.error(err));
  }

  //---Priveleged Commands---

  //Set Weekly Topic
  if (command === "settopic"){
    if (!authCheck(message, 1, "set the topic")) return;
    let newtopic = message.content.slice(message.content.indexOf(" ")+1);
    if (newtopic == config.prefix + command){
      message.channel.send("Expected 1 argument - topic to set");
      return;
    }
    config.topic = newtopic;
    saveConfig(config);
    message.channel.send(`Set topic to "${config.topic}"`).catch((err) => logger.error(err));
  }

  //---Owner Only Commands---

  //Set Bot Game
  if (command === "setgame"){
    if (!authCheck(message, 0)) return;
    let newGame = message.content.slice(message.content.indexOf(" ")+1);
    if (newGame == config.prefix + command){
      message.channel.send("Expected 1 argument - game to set");
      return;
    }
    logger.info(`Setting game to "${newGame}"`);
    config.game = newGame;
    client.user.setGame(newGame);
    saveConfig(config);
  }

});

//Welcome new members
client.on("guildMemberAdd", (member) => {
  logger.info(`New User ${member.user.username} has joined ${member.guild.name}` );
  member.guild.defaultChannel.send(`Welcome ${member.displayName} to ${member.guild.name}!`);
  member.guild.defaultChannel.send("Message a moderator or admin to get permission to talk");
  member.guild.defaultChannel.send(`Messages in this channel are removed after ${config.cleanupTime / 60000} minutes for privacy.`);
});
