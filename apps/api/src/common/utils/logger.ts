import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

/**
 * Winston logger configuration with daily rotating file transport.
 * Logs are stored in the 'logs/' directory with automatic rotation and compression.
 *
 * Features:
 * - Console output for development (colorized and pretty-printed)
 * - Rotating file transport for all logs (application-%DATE%.log)
 * - Separate rotating file for errors only (error-%DATE%.log)
 * - Automatic log rotation based on date and size
 * - Old logs compressed (.gz) after rotation
 * - Logs retained for 14 days
 *
 * Log Levels: error, warn, info, http, debug
 */

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const logsDir = path.join(process.cwd(), 'logs');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      // Filter out internal winston properties
      const { timestamp: _, level: __, message: ___, ...cleanMeta } = meta as Record<string, unknown>;
      if (Object.keys(cleanMeta).length > 0) {
        msg += `\n${JSON.stringify(cleanMeta, null, 2)}`;
      }
    }

    return msg;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Daily rotate file transport for all logs
const allLogsTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

// Daily rotate file transport for error logs only
const errorLogsTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  format: fileFormat,
});

// Create the logger instance
const logger = winston.createLogger({
  level: logLevel,
  transports: [
    allLogsTransport,
    errorLogsTransport,
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Handle unhandled rejections and exceptions
allLogsTransport.on('rotate', (oldFilename: string, newFilename: string) => {
  logger.info('Log file rotated', { oldFilename, newFilename });
});

export default logger;
