/* eslint-disable no-console */
type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug';

const levels: LogLevel[] = ['off', 'error', 'warn', 'info', 'debug'];

function getConfiguredLevel(): LogLevel {
  const raw = import.meta.env.VITE_LOG_LEVEL as string | undefined;
  if (raw && levels.includes(raw as LogLevel)) {
    return raw as LogLevel;
  }
  return 'off';
}

const configuredLevel = getConfiguredLevel();
const configuredIndex = levels.indexOf(configuredLevel);

function isEnabled(messageLevel: LogLevel): boolean {
  if (configuredLevel === 'off') return false;
  return levels.indexOf(messageLevel) <= configuredIndex;
}

export const logger = {
  error: (...args: unknown[]) => { if (isEnabled('error')) console.error(...args); },
  warn:  (...args: unknown[]) => { if (isEnabled('warn'))  console.warn(...args); },
  info:  (...args: unknown[]) => { if (isEnabled('info'))  console.info(...args); },
  debug: (...args: unknown[]) => { if (isEnabled('debug')) console.debug(...args); },
};
