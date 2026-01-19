import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from './env';

/**
 * Initialize Sentry for error monitoring and performance tracking
 */
export const initSentry = (): void => {
  if (!env.SENTRY_DSN) {
    console.log('Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0, // Sample 10% in production

    // Profiling
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [nodeProfilingIntegration()],

    // Don't send errors in development unless explicitly configured
    enabled: env.NODE_ENV === 'production' || !!env.SENTRY_DSN,

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  console.log('✅ Sentry initialized for error monitoring');
};
