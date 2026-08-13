import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/connection.js';
import { translateText, getDeepLUsage } from '../translation/deepl.js';

export const translateRouter = Router();

/**
 * GET /api/translate/:id?lang=en
 * 
 * Returns the translated description for a listing.
 * If not cached, translates on-the-fly and caches in the database.
 */
translateRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const targetLang = (req.query.lang as string)?.toUpperCase() === 'NL' ? 'NL' : 'EN';

    // Get listing with both description columns
    const listing = await queryOne<{
      id: string;
      description: string | null;
      description_en: string | null;
    }>(
      `SELECT id, description, description_en FROM listings WHERE id = $1`,
      [id],
    );

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // If requesting English and we have a cached translation
    if (targetLang === 'EN' && listing.description_en) {
      res.json({ description: listing.description_en, lang: 'EN', cached: true });
      return;
    }

    // If requesting NL, return the original (which is typically Dutch)
    if (targetLang === 'NL') {
      res.json({ description: listing.description || '', lang: 'NL', cached: true });
      return;
    }

    // Need to translate to English
    if (!listing.description) {
      res.json({ description: '', lang: 'EN', cached: false });
      return;
    }

    const result = await translateText(listing.description, 'EN');
    
    if (!result) {
      // Translation failed (no API key or error) — return original
      res.json({ description: listing.description, lang: 'original', cached: false });
      return;
    }

    // Cache the translation
    await query(
      `UPDATE listings SET description_en = $1 WHERE id = $2`,
      [result.translatedText, id],
    );

    res.json({ description: result.translatedText, lang: 'EN', cached: false, detectedSource: result.detectedSourceLang });
  } catch (err) {
    console.error('[OTO] Translation endpoint error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

/**
 * GET /api/translate/usage
 * Returns DeepL API usage statistics.
 */
translateRouter.get('/usage/stats', async (_req: Request, res: Response): Promise<void> => {
  const usage = await getDeepLUsage();
  if (!usage) {
    res.json({ configured: false, message: 'DeepL API key not configured' });
    return;
  }
  res.json({
    configured: true,
    characterCount: usage.characterCount,
    characterLimit: usage.characterLimit,
    remainingPercent: Math.round((1 - usage.characterCount / usage.characterLimit) * 100),
  });
});

/**
 * POST /api/translate/batch
 * Translate up to 10 listings in the background. Used by the cron job.
 */
translateRouter.post('/batch', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get listings that have a description but no English translation
    const listings = await query<{ id: string; description: string }>(
      `SELECT id, description FROM listings 
       WHERE description IS NOT NULL 
         AND description != '' 
         AND description_en IS NULL 
         AND LENGTH(description) > 20
       ORDER BY date_added DESC
       LIMIT 3`,
    );

    let translated = 0;
    for (const listing of listings.rows) {
      const result = await translateText(listing.description, 'EN');
      if (result) {
        await query(
          `UPDATE listings SET description_en = $1 WHERE id = $2`,
          [result.translatedText, listing.id],
        );
        translated++;
      }
      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    res.json({ success: true, checked: listings.rows.length, translated });
  } catch (err) {
    console.error('[OTO] Batch translation error:', err);
    res.status(500).json({ error: String(err) });
  }
});
