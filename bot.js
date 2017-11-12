const Commando = require("discord.js-commando");
const RichEmbed = require("discord.js").RichEmbed;
const path = require("path");
const config = require("./config.js");
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
              let textWords = messagesArr[i].cleanContent.split(" ");
              let choppedText = [];
              for (let i=0; i<textWords.length; i++){
                if (textWords[i].length > 100){
                  choppedText = choppedText.concat(textWords[i].match(/[\s\S]{1,100}/g) || []);
                } else {
                  choppedText.push(textWords[i]);
                }
              }

              const embed = new RichEmbed()
                .setDescription(choppedText.join[" "])
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
  client.user.setGame(module.exports.version);

  setInterval(cleanup, 30000);
});

//Welcome new members
client.on("guildMemberAdd", (member) => {
  logger.info(`New User ${member.user.username} has joined ${member.guild.name}` );
  member.guild.defaultChannel.send(`Welcome ${member.displayName} to ${member.guild.name}!`);
  member.guild.defaultChannel.send("Message a moderator or admin to get permission to talk");
  member.guild.defaultChannel.send(`Messages in this channel are removed after ${config.cleanupTime / 60000} minutes for privacy.`);
});
