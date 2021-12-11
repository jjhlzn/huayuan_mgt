const winston = require('winston');

winston.addColors({
  info: 'green',
  warn: 'cyan',
  error: 'red',
  verbose: 'blue',
  i: 'gray',
  db: 'magenta',
  debug: 'white',
});

function pad(width, string, padding) { 
  return (width <= string.length) ? string : pad(width, padding + string, padding)
}

const colorizer = winston.format.colorize();

const { createLogger, format, transports } = require('winston');
const { combine,timestamp, label, printf } = format;
const moment = require('moment');

const myFormat = printf(info => {
  return `[${moment(info.timestamp).format('YYYY-MM-DD HH:mm:ss,SSS')}] [${pad(23, info.label, ' ')}] [${pad(5, info.level, ' ')}] ${info.message}`;
})

const alignedWithColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => {
      const {
        timestamp, level, message, ...args
      } = info;

      const ts = timestamp.slice(0, 19).replace('T', ' ');
      return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
    }),
  );
  
const createMyLogger = (myLabel) => {
  //let logger = createLogger(alignedWithColorsAndTime);
    

    const logger = winston.createLogger({
        level: 'debug',
        format: combine(
            label({ label: myLabel }),
            winston.format.timestamp(),
            winston.format.simple(),
            winston.format.printf(info => 
            colorizer.colorize(info.level, `[${moment(info.timestamp).format('YYYY-MM-DD HH:mm:ss,SSS')}] [${pad(23, info.label, ' ')}] [${pad(5, info.level, ' ')}] ${info.message}`)
            )
        ),
        transports: [
            new transports.Console(),
        ]

    });
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
  //if (process.env.NODE_ENV !== 'production') {
      /*
    logger.add(new winston.transports.Console({
      colorize: 'true',
      format:  combine(
        label({ label: myLabel }),
        timestamp(),
        //myFormat
        winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`),
      )
    }));
  //}*/
  
  return logger;
}



module.exports = createMyLogger