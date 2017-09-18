const config = require("./config.js");
//Check authorisation to perform command
module.exports = ( (message, rank, operation) => {
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
