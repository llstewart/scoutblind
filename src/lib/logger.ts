import pino from 'pino';

const isServer = typeof window === 'undefined';

// Only create pino logger on server-side (it uses Node.js APIs)
// On client-side, fall back to console
function createLogger() {
  if (!isServer) {
    // Return a console-based logger for client-side compatibility
    return {
      info: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
      child: () => createLogger(),
    } as unknown as pino.Logger;
  }

  return pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  });
}

export const logger = createLogger();

// Domain child loggers
export const searchLogger = logger.child({ module: 'search' });
export const creditsLogger = logger.child({ module: 'credits' });
export const outscrapterLogger = logger.child({ module: 'outscraper' });
export const analysisLogger = logger.child({ module: 'analysis' });
export const stripeLogger = logger.child({ module: 'stripe' });
export const leadsLogger = logger.child({ module: 'leads' });
export const websiteLogger = logger.child({ module: 'website-analyzer' });
export const cacheLogger = logger.child({ module: 'cache' });
export const rateLimitLogger = logger.child({ module: 'rate-limit' });
export const visibilityLogger = logger.child({ module: 'visibility' });
export const circuitBreakerLogger = logger.child({ module: 'circuit-breaker' });
