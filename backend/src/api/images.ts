import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/connection.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export const imagesRouter = Router();

/** Directory where cached images are stored */
const IMAGE_CACHE_DIR = process.env.IMAGE_CACHE_DIR || path.resolve('./image-cache');

/** Cache TTL: 24 hours in milliseconds */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Fetch timeout: 10 seconds */
const FETCH_TIMEOUT_MS = 10_000;

/** Placeholder SVG for when source images fail to load */
const PLACEHOLDER_SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f0f0f0"/>
  <g fill="#ccc" transform="translate(100, 80)">
    <rect x="20" y="80" width="160" height="60" rx="10"/>
    <rect x="40" y="60" width="120" height="40" rx="8"/>
    <circle cx="55" cy="140" r="20"/>
    <circle cx="145" cy="140" r="20"/>
    <circle cx="55" cy="140" r="10" fill="#f0f0f0"/>
    <circle cx="145" cy="140" r="10" fill="#f0f0f0"/>
  </g>
  <text x="200" y="260" text-anchor="middle" fill="#999" font-family="sans-serif" font-size="14">Image unavailable</text>
</svg>`);

const PLACEHOLDER_CONTENT_TYPE = 'image/svg+xml';

/**
 * Ensure the image cache directory exists.
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(IMAGE_CACHE_DIR)) {
    fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
  }
}

/**
 * Generate a safe file name from an encoded URL using a hash.
 */
function getFileName(encodedUrl: string): string {
  const hash = crypto.createHash('sha256').update(encodedUrl).digest('hex');
  return hash;
}

interface CacheEntry {
  id: string;
  encoded_url: string;
  original_url: string;
  content_type: string;
  file_path: string;
  file_size_bytes: number;
  cached_at: Date;
  last_accessed: Date;
}

/**
 * GET /api/images/:encodedUrl
 *
 * Proxies images from external sources, caching them locally.
 * - Serves cached version if less than 24 hours old
 * - Re-fetches if expired or not cached
 * - Returns placeholder on source error (always HTTP 200)
 */
imagesRouter.get('/:encodedUrl', async (req: Request, res: Response): Promise<void> => {
  const encodedUrl = req.params.encodedUrl as string;

  try {
    // Decode the original URL
    let originalUrl: string;
    try {
      originalUrl = decodeURIComponent(encodedUrl);
    } catch {
      res.status(400).json({ error: 'Invalid encoded URL' });
      return;
    }

    // Check for existing cache entry
    const cacheEntry = await queryOne<CacheEntry>(
      'SELECT * FROM image_cache WHERE encoded_url = $1',
      [encodedUrl]
    );

    if (cacheEntry) {
      const cachedAt = new Date(cacheEntry.cached_at);
      const age = Date.now() - cachedAt.getTime();

      // Serve from cache if still valid (less than 24h old) and file exists
      if (age < CACHE_TTL_MS && fs.existsSync(cacheEntry.file_path)) {
        // Update last_accessed timestamp
        await query(
          'UPDATE image_cache SET last_accessed = NOW() WHERE id = $1',
          [cacheEntry.id]
        );

        const fileData = fs.readFileSync(cacheEntry.file_path);
        res.set('Content-Type', cacheEntry.content_type);
        res.set('Cache-Control', 'public, max-age=86400');
        res.status(200).send(fileData);
        return;
      }
    }

    // Cache miss or expired — fetch from source
    const imageData = await fetchImage(originalUrl);

    if (imageData) {
      // Save to disk
      ensureCacheDir();
      const fileName = getFileName(encodedUrl);
      const filePath = path.join(IMAGE_CACHE_DIR, fileName);
      fs.writeFileSync(filePath, imageData.data);

      // Upsert into image_cache table
      await query(
        `INSERT INTO image_cache (encoded_url, original_url, content_type, file_path, file_size_bytes, cached_at, last_accessed)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (encoded_url)
         DO UPDATE SET
           original_url = EXCLUDED.original_url,
           content_type = EXCLUDED.content_type,
           file_path = EXCLUDED.file_path,
           file_size_bytes = EXCLUDED.file_size_bytes,
           cached_at = NOW(),
           last_accessed = NOW()`,
        [encodedUrl, originalUrl, imageData.contentType, filePath, imageData.data.length]
      );

      res.set('Content-Type', imageData.contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      res.status(200).send(imageData.data);
    } else {
      // Source error — return placeholder
      res.set('Content-Type', PLACEHOLDER_CONTENT_TYPE);
      res.set('Cache-Control', 'public, max-age=86400');
      res.status(200).send(PLACEHOLDER_SVG);
    }
  } catch (err) {
    console.error('[ImageProxy] Unexpected error:', err);
    // Even on unexpected errors, return placeholder with 200
    res.set('Content-Type', PLACEHOLDER_CONTENT_TYPE);
    res.set('Cache-Control', 'public, max-age=86400');
    res.status(200).send(PLACEHOLDER_SVG);
  }
});

/**
 * Fetch an image from the given URL.
 * Returns null on any error (timeout, non-2xx status, non-image content type).
 */
async function fetchImage(url: string): Promise<{ data: Buffer; contentType: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OTO-ImageProxy/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[ImageProxy] Source returned ${response.status} for: ${url}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Only accept image content types
    if (!contentType.startsWith('image/')) {
      console.warn(`[ImageProxy] Unsupported content type "${contentType}" for: ${url}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    return { data, contentType };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[ImageProxy] Fetch error for ${url}: ${message}`);
    return null;
  }
}
