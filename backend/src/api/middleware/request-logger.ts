import type { Request, Response, NextFunction } from 'express';

/**
 * Simple request logging middleware.
 * Logs method, path, status code, and response duration for each request.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, path } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const logLine = `${method} ${path} ${status} ${duration}ms`;

    if (status >= 500) {
      console.error(`[ERROR] ${logLine}`);
    } else if (status >= 400) {
      console.warn(`[WARN]  ${logLine}`);
    } else {
      console.log(`[INFO]  ${logLine}`);
    }
  });

  next();
}
