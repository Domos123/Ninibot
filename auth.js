const config = require("./config.js");
const logger = require("./logger.js");
//Check authorisation to perform command
module.exports = ( (message, rank, operation) => {
  let userLevel = 99999;
  for (var role of config.roles){
    if (message.member.roles.has(role.id)) {
      userLevel = role.rank;
      break;
    }
  }
  if (message.member.id == config.ownerID){
    userLevel = 0;
  }
  if (!(userLevel <= rank)){
    if (operation) message.channel.send(`Sorry, you do not have permission to ${operation}`);
    logger.trace(`${message.member.displayName} is level ${userLevel}, ${operation} requires ${rank}, not performing ${operation}`);
    return false;
  }
  return true;
});
