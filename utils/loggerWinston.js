const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  format: format.combine(
    format.simple(),
    format.timestamp(),
    format.printf((info) => `[${info.timestamp} ${info.level} ${info.message}]`)
  ),
  transports: [
    new transports.Console({ level: 'info' }),
    new transports.File({ filename: 'dataLogger/error.log', level: 'error' }),
  ],
});

module.exports = logger;
