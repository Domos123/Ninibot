const Commando = require("discord.js-commando");
const RichEmbed = require("discord.js").RichEmbed;
const path = require("path");
const config = require("./config.js");
const saveConfig = require("./saveConfig.js");
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
client.login(config.token).catch((err) => logger.error(err));

//Delete old messages
let cleanup = ( () => {
  let mainchat = client.channels.get(config.mainChannel);
  let backuproom = client.channels.get(config.backupChannel);

  mainchat.fetchMessages({limit:100})
          .then(messages => {
            let messagesArr = messages.array();
            let messageCount = messagesArr.length;

            let messagesDeleted = 0;
            let emptyChannelMessage = null;
            for(let i = messageCount - 1; i >= 0; i--) {

              //Find empty channel message
              if (messagesArr[i].author.id === client.user.id && /^There's nobody around right now, but I saw someone about/.test(messagesArr[i].cleanContent)){
                emptyChannelMessage = messagesArr[i];
                continue;
              }

              //If there are more messages, delete the empty channel message
              if (emptyChannelMessage != null){
                emptyChannelMessage.delete().catch( (err) => logger.error(`Error deleting empty channel message: ${err.name} - ${err.message}`));
                messagesDeleted+=1;
              }

              //Message is too new to delete
              if (Date.now() - messagesArr[i].createdAt < config.cleanupTime) return;

              //Back up message as embed
              const embed = new RichEmbed()
                .setDescription(messagesArr[i].cleanContent)
                .setFooter(messagesArr[i].author.tag)
                .setColor(messagesArr[i].member?messagesArr[i].member.displayHexColor:0xaaaaaa)
                .setTimestamp(messagesArr[i].createdAt)
                .setAuthor(messagesArr[i].member?messagesArr[i].member.displayName:messagesArr[i].author.username, messagesArr[i].author.avatarURL);
              backuproom.send({embed}).catch( (err) => logger.error(err));

              //Store timestamp of deleted message
              config.lastMessageAt = messagesArr[i].createdTimestamp;
              messagesArr[i].delete().catch( (err) => logger.error(err));

              messagesDeleted+=1;
            }
            //Store last deleted message timestamp
            saveConfig(config);

            //"Last message was time ago"
            if (messageCount - messagesDeleted === 0){
              let lastMessageAt = config.lastMessageAt;
              let dT = Date.now() - lastMessageAt;

              let ago = Math.round(dT/60000);
              let noun = "minute";

              if (ago > 60){
                ago = Math.round(ago / 60);
                noun = "hour";

                if (ago > 24){
                  ago = Math.round(ago / 24);
                  noun = "day";

                  if (ago > 7){
                    ago = Math.round(ago / 7);
                    noun = "week";
                  }
                }
              }

              if (ago > 1){
                noun += "s";
              }

              mainchat.send(`There's nobody around right now, but I saw someone about ${ago} ${noun} before this message.`);
            }
          }).catch((err) => logger.error(err));
  setTimeout(cleanup, 30000);
});

//When the bot has logged in to Discord
client.on("ready", () => {
  logger.info(`Bot Ready - ${module.exports.name} - ${module.exports.version}`);
  client.user.setGame(module.exports.version);
  setTimeout(cleanup, 30000);
});

/*//Welcome new members
client.on("guildMemberAdd", (member) => {
  logger.info(`New User ${member.user.username} has joined ${member.guild.name}` );
  member.guild.defaultChannel.send(`Welcome ${member.displayName} to ${member.guild.name}!`);
  member.guild.defaultChannel.send("Message a moderator or admin to get permission to talk");
  member.guild.defaultChannel.send(`Messages in this channel are removed after ${config.cleanupTime / 60000} minutes for privacy.`);
}).catch((err) => logger.error(err));*/
