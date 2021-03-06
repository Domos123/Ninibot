const log4js = require("log4js");

//Set up logging
log4js.configure({
  appenders: {
    out: { type: "console", layout: {
      type: "pattern",
      pattern: "%[[%p]%] %m"
    } }
  },
  categories: {
    default: { appenders: ["out"], level: "trace" }
  }
});

module.exports = log4js.getLogger("default");
