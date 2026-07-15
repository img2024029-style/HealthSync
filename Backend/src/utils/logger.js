const winston = require('winston');
const morgan = require('morgan');

const isDev = () => process.env.NODE_ENV === 'development';

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    http: 'magenta',
    debug: 'gray',
  },
};

winston.addColors(customLevels.colors);

// Formatting for development console logs
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, label, reqId, ...meta }) => {
    const reqIdStr = reqId ? ` [reqId=${reqId}]` : '';
    const labelStr = label ? ` [${label}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    // Manual colorizing for level to avoid color codes mess in text
    let color = '';
    if (level.includes('error')) color = '\x1b[31m';
    else if (level.includes('warn')) color = '\x1b[33m';
    else if (level.includes('info')) color = '\x1b[36m';
    else if (level.includes('http')) color = '\x1b[35m';
    else if (level.includes('debug')) color = '\x1b[90m';
    const reset = '\x1b[0m';

    return `${color}[${level.toUpperCase()}]${reset} ${timestamp}${labelStr}${reqIdStr} — ${message}${metaStr}`;
  })
);

// Formatting for production json logs
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const transports = [
  new winston.transports.Console({
    format: isDev() ? devFormat : prodFormat,
  }),
];

// Add file logging in non-development/non-test environments
if (!isDev() && process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', format: prodFormat }),
    new winston.transports.File({ filename: 'logs/combined.log', format: prodFormat })
  );
}

const logger = winston.createLogger({
  level: isDev() ? 'debug' : 'info',
  levels: customLevels.levels,
  transports,
});

/**
 * Setup Morgan HTTP request logger middleware integrated with Winston stream.
 */
const setupHttpLogger = (app) => {
  const morganStream = {
    write: (message) => {
      logger.log('http', message.trim());
    },
  };

  if (isDev()) {
    app.use(morgan('dev', { stream: morganStream }));
  } else {
    // Combined format for production to capture details in JSON logger
    app.use(
      morgan(
        ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
        { stream: morganStream }
      )
    );
  }
};

module.exports = logger;
module.exports.setupHttpLogger = setupHttpLogger;
