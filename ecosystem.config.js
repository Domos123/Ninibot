module.exports = {
  apps : [
    {
      name            : "Agender Bot",
      script          : "./bot.js",
      watch           : false,
      node_args       : "--harmony",
      log_date_format : "YYYY-MM-DD HH:mm",
      autorestart     : true,
      restart_delay   : 4000
    },
  ]
};
