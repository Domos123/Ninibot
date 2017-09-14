const Discord = require("discord.js");
const RichEmbed = require("discord.js").RichEmbed;
const log4js = require("log4js");
const fs = require("fs");

//No more including version number in config <3
require("pkginfo")(module);

const client = new Discord.Client();
//Set up logging
log4js.configure({
  appenders: {
    out: { type: "console" },
    app: { type: "file", filename: "logs/info.log"},
  },
  categories: {
    default: { appenders: [ "out", "app" ], level: "trace" }
  }
});

const logger = log4js.getLogger("default");

logger.info("Starting Bot");

//Config in case none is present
let initConfig = ( () => {
  config = {
    game: "The game the bot will be playing",
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
    topic: "No topic set"};
  //Have to syncronous write so we don't quit before we save
  fs.writeFileSync("./config.json", JSON.stringify(config,null,2), "utf8", (err) => {if (err) logger.error(err);});
  logger.info("Config was not found or malformed. Set up default config. Please configure then restart");
  process.exit(1);
});

//Load config, or if we can't, set one up and quit
var config;
try {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
} catch (err) {
  initConfig();
}

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
              /**var tag = "\`\`\`";
              if (authCheck(messagesArr[i], 2)){
                tag += "md\n#";
              }
              else if (messagesArr[i].author.bot) {
                tag += "py\n@";
              }
              tag +=`${messagesArr[i].author.tag} At ${messagesArr[i].createdAt.getUTCHours()}:${messagesArr[i].createdAt.getUTCMinutes()} UTC on ${messagesArr[i].createdAt.getUTCMonth()}\/${messagesArr[i].createdAt.getUTCDay()}\/${messagesArr[i].createdAt.getUTCFullYear()}:\`\`\``;**/
              const embed = new RichEmbed()
                .addField("",messagesArr[i].cleanContent)
                .setFooter(`${messagesArr[i].author.tag} @ ${messagesArr[i].createdAt.getUTCHours()}:${messagesArr[i].createdAt.getUTCMinutes()} UTC ${messagesArr[i].createdAt.getUTCMonth()}\/${messagesArr[i].createdAt.getUTCDay()}\/${messagesArr[i].createdAt.getUTCFullYear()}`)
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

//Authorisation Check for Mod and up
let authCheck = ( (message, rank, operation) => {
  let userLevel = 99999;
  for (var role of config.roles){
    if (message.member.roles.has(role.id)) {
      userLevel = role.rank;
      break;
    }
  }
  if (!(userLevel <= rank)){
    if (operation) message.channel.send(`Sorry, you do not have permission to ${operation}`);
    return false;
  }
  return true;
});

//Save the config file
let saveConfig = ( () => {
  fs.writeFile("./config.json", JSON.stringify(config,null,2), "utf8", (err) => {if (err) logger.error(err);});
});

//When the bot has logged in to Discord
client.on("ready", () => {
  logger.info(`Bot Ready - ${module.exports.name} - ${module.exports.version}`);
  client.user.setGame(config.game);

  setInterval(cleanup, 30000);
});

//Handle messages
client.on("message", (message) => {
  if (!message.content.startsWith(config.prefix) || message.author.bot) return;

  //Reject PMs and leave channel
  if (message.channel.type != "text") {
    message.channel.send("Sorry, this bot currently does not support direct messages");
    message.channel.delete().catch((err) => logger.error(err));
    return;
  }

  let command = message.content.toLowerCase().split(" ")[0].slice(1);

  //Get info about bot
  if (command === "about"){
    message.channel.send(`Hi, I'm ${module.exports.name} ${module.exports.version}.\nI was created by ${module.exports.author.name} and can be found at ${module.exports.homepage} or on npm.`);
  }

  //Check privacy time
  if (command === "privacy"){
    message.channel.send(`Messages in this channel are removed after ${config.cleanupTime / 60000} minutes for privacy.`);
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
    saveConfig();
    message.channel.send(`Set topic to "${config.topic}"`).catch((err) => logger.error(err));
  }

  //Set time after which to delete old messages
  if (command === "setcleanuptime"){
    if (!authCheck(message, 2, "set the cleanup time")) return;
    let timeout = +message.content.slice(message.content.indexOf(" ")+1);
    if (isNaN(timeout) || timeout > 20000 || timeout < 1 || (timeout % 1 != 0)) {
      message.channel.send(`Cannot set timeout to "${message.content.slice(message.content.indexOf(" ")+1)}"`);
      return;
    }
    timeout *= 60000;
    config.cleanupTime = timeout;
    saveConfig();
    message.channel.send(`Messages in this channel are removed after ${config.cleanupTime / 60000} minutes for privacy.`);
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
    saveConfig();
  }

});

//Welcome new members
client.on("guildMemberAdd", (member) => {
  logger.info(`New User ${member.user.username} has joined ${member.guild.name}` );
  member.guild.defaultChannel.send(`Welcome ${member.displayName} to ${member.guild.name}!`);
  member.guild.defaultChannel.send("Message a moderator or admin to get permission to talk");
  member.guild.defaultChannel.send(`Messages in this channel are removed after ${config.cleanupTime / 60000} minutes for privacy.`);
});
