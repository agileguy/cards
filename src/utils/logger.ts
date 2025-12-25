import debug from 'debug';

/**
 * Logger utility using the debug package for controlled debug logging.
 *
 * Logs are disabled by default in production. Enable them by setting
 * the DEBUG environment variable:
 *
 * - DEBUG=cards:* - Enable all cards logs
 * - DEBUG=cards:lobby - Enable only lobby logs
 * - DEBUG=cards:lobby,cards:server - Enable multiple namespaces
 *
 * Usage:
 * ```typescript
 * import { createLogger } from '../utils/logger';
 * const log = createLogger('lobby');
 *
 * log('Player joined:', { sessionId, name });
 * log.warn('Player timeout:', { sessionId });
 * log.error('Match failed:', { error });
 * ```
 */

const APP_NAMESPACE = 'cards';

export interface Logger {
  (message: string, ...args: any[]): void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

/**
 * Create a namespaced logger
 * @param namespace - The namespace for this logger (e.g., 'lobby', 'server', 'matchmaker')
 * @returns Logger instance with log, warn, and error methods
 */
export function createLogger(namespace: string): Logger {
  const baseDebug = debug(`${APP_NAMESPACE}:${namespace}`);
  const warnDebug = debug(`${APP_NAMESPACE}:${namespace}:warn`);
  const errorDebug = debug(`${APP_NAMESPACE}:${namespace}:error`);

  const logger = (message: string, ...args: any[]) => {
    baseDebug(message, ...args);
  };

  logger.warn = (message: string, ...args: any[]) => {
    warnDebug(message, ...args);
  };

  logger.error = (message: string, ...args: any[]) => {
    errorDebug(message, ...args);
  };

  return logger as Logger;
}
