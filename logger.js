const log4js = require("log4js");

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

module.exports = log4js.getLogger("default");
