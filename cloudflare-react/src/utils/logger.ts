/**
 * Logger utility для контролю логування в різних середовищах
 * У продакшні всі логи (крім error) можуть бути вимкнені
 */

const IS_PRODUCTION = import.meta.env.PROD;
const ENABLE_DEBUG_LOGS = !IS_PRODUCTION || import.meta.env.VITE_ENABLE_LOGS === 'true';

export const logger = {
  log: (...args: any[]) => {
    if (ENABLE_DEBUG_LOGS) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (ENABLE_DEBUG_LOGS) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // Завжди показуємо помилки, навіть у продакшні
    console.error(...args);
  },

  info: (...args: any[]) => {
    if (ENABLE_DEBUG_LOGS) {
      console.info(...args);
    }
  },

  debug: (...args: any[]) => {
    if (ENABLE_DEBUG_LOGS) {
      console.debug(...args);
    }
  }
};
