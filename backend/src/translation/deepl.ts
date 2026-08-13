/**
 * DeepL translation service for OTO.
 * Translates listing descriptions between NL and EN.
 * Respects the free tier limit (500k chars/month).
 */

import { env } from '../config/env.js';

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export type TargetLang = 'EN' | 'NL';

interface DeepLResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

/**
 * Translate text using DeepL API.
 * Returns null if API key is not configured or request fails.
 */
export async function translateText(
  text: string,
  targetLang: TargetLang,
): Promise<{ translatedText: string; detectedSourceLang: string } | null> {
  if (!env.DEEPL_API_KEY) {
    return null;
  }

  // Skip translation if text is too short or empty
  if (!text || text.trim().length < 10) {
    return null;
  }

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang === 'EN' ? 'EN-GB' : 'NL',
        // Preserve HTML formatting
        tag_handling: 'html',
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[OTO] DeepL API error ${response.status}: ${errBody}`);
      return null;
    }

    const data: DeepLResponse = await response.json();
    const result = data.translations[0];

    if (!result) return null;

    return {
      translatedText: result.text,
      detectedSourceLang: result.detected_source_language,
    };
  } catch (err) {
    console.error('[OTO] DeepL translation failed:', err);
    return null;
  }
}

/**
 * Check remaining DeepL usage for the current billing period.
 */
export async function getDeepLUsage(): Promise<{ characterCount: number; characterLimit: number } | null> {
  if (!env.DEEPL_API_KEY) return null;

  try {
    const response = await fetch('https://api-free.deepl.com/v2/usage', {
      headers: { 'Authorization': `DeepL-Auth-Key ${env.DEEPL_API_KEY}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      characterCount: data.character_count,
      characterLimit: data.character_limit,
    };
  } catch {
    return null;
  }
}
