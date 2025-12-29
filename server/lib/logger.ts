import winston from 'winston';
import fs from 'fs';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from './env';

/**
 * Custom log format for better readability
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // Add stack trace if present
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

/**
 * JSON format for production (easier to parse)
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Determine log format based on environment
 */
const logFormat = env.NODE_ENV === 'production' ? jsonFormat : customFormat;

/**
 * Console transport - used in all environments
 * In production/Docker, logs go to stdout which is captured by the platform
 */
const consoleTransport = new winston.transports.Console({
  format: env.NODE_ENV === 'production'
    ? jsonFormat  // JSON for production (easier to parse in log aggregators)
    : winston.format.combine(winston.format.colorize(), customFormat),
});

/**
 * Build transports array based on environment
 * In production (Docker/Render): only console (stdout)
 * In development: console + file transports
 */
function buildTransports(): winston.transport[] {
  const transports: winston.transport[] = [consoleTransport];

  // Only add file transports in development (not in Docker/production)
  if (env.NODE_ENV !== 'production') {

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // File transport for errors
    const errorFileTransport = new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    });

    // Rotating file transport for all logs
    const combinedFileTransport = new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    });

    transports.push(errorFileTransport, combinedFileTransport);
  }

  return transports;
}

/**
 * Create Winston logger instance
 */
const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'budgetbot',
    environment: env.NODE_ENV,
  },
  transports: buildTransports(),
  exitOnError: false,
});

/**
 * Helper functions for common log patterns
 */
export const logError = (message: string, error?: Error | any, meta?: object) => {
  logger.error(message, {
    error: error?.message,
    stack: error?.stack,
    ...meta,
  });
};

export const logWarning = (message: string, meta?: object) => {
  logger.warn(message, meta);
};

export const logInfo = (message: string, meta?: object) => {
  logger.info(message, meta);
};

export const logDebug = (message: string, meta?: object) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: object) => {
  logger.http(message, meta);
};

/**
 * Log HTTP request
 */
export const logRequest = (req: any, res: any, duration: number) => {
  const meta = {
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  };

  // Log different levels based on status code
  if (res.statusCode >= 500) {
    logger.error(`${req.method} ${req.path} ${res.statusCode}`, meta);
  } else if (res.statusCode >= 400) {
    logger.warn(`${req.method} ${req.path} ${res.statusCode}`, meta);
  } else {
    logger.http(`${req.method} ${req.path} ${res.statusCode}`, meta);
  }
};

/**
 * Export logger instance
 */
export default logger;
