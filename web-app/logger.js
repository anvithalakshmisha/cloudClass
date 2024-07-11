const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
//   levels: 
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.json()
  ),
  transports: [
    // new transports.File({ filename: 'quick-start-error.log', level: 'error' }),
    new winston.transports.File({ filename: "csye6225.log" }),
  ],
});

module.exports = logger;