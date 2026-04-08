import * as Sentry from '@sentry/react-native';

export const logger = {
  info: (message: string, data?: any) => {
    if (__DEV__) console.log(`📘 [INFO]: ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    if (__DEV__) console.warn(`📙 [WARN]: ${message}`, data || '');
    // Optional: Send critical warnings to Sentry
    Sentry.captureMessage(message, 'warning');
  },
  error: (message: string, error: any) => {
    if (__DEV__) console.error(`📕 [ERROR]: ${message}`, error);
    
    // 🚨 Automatically send all actual errors to Sentry
    Sentry.captureException(error, {
      extra: { context: message }
    });
  }
};