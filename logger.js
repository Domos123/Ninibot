const log4js = require("log4js");

//Set up logging
log4js.configure({
  appenders: {
    out: { type: "console", layout: {
      type: "pattern",
      pattern: "%[%d{yyyy/MM/dd-hh:mm:ss} [%p]%] %m"
    } },
    app: { type: "file", layout: {
      type: "pattern",
      pattern: "%[%d{yyyy/MM/dd-hh:mm:ss} [%p]%] %m"
    }, filename: "logs/info.log"},
  },
  categories: {
    default: { appenders: [ "out", "app" ], level: "trace" }
  }
});

module.exports = log4js.getLogger("default");
