import type { Request, Response, NextFunction } from 'express';
import { timeoutError } from './error-handler.js';

const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Middleware that enforces a response timeout.
 * If the route handler does not respond within the configured duration,
 * a 408 Request Timeout response is sent.
 *
 * @param timeoutMs - Timeout duration in milliseconds (default: 5000ms)
 */
export function timeout(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      if (!res.headersSent) {
        const err = timeoutError(
          'Request timed out. The query took longer than expected. Please try again or simplify your filter criteria.',
        );
        res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
          },
        });
      }
    }, timeoutMs);

    // Override res.end to clear the timeout when the response completes normally
    const originalEnd = res.end.bind(res);
    (res as any).end = function (...args: any[]) {
      clearTimeout(timer);
      if (!timedOut) {
        return originalEnd(...args);
      }
    };

    // Also clear on 'finish' event as a safety net
    res.on('finish', () => {
      clearTimeout(timer);
    });

    // Attach timedOut check so downstream handlers can detect it
    (req as any).__timedOut = () => timedOut;

    next();
  };
}

/**
 * Check if the request has already timed out.
 * Useful in async handlers to bail early.
 */
export function isTimedOut(req: Request): boolean {
  return typeof (req as any).__timedOut === 'function' && (req as any).__timedOut();
}
