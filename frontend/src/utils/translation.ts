/**
 * Translation resolution utility.
 *
 * Determines which text (original Dutch or English translation) to display
 * based on the active locale and the validity of the translated content.
 */

import type { Locale } from '../i18n/translations';

/**
 * The result of resolving which translation text to display.
 *
 * - `text`: The resolved display text
 * - `badge`: Indicates the translation status for UI badge rendering
 *   - `'translated'` — English translation is shown
 *   - `'original-nl'` — Fallback to original Dutch (no valid translation)
 *   - `'none'` — No badge needed (viewing in native language)
 */
export interface TranslationState {
  text: string;
  badge: 'translated' | 'original-nl' | 'none';
}

/**
 * Checks whether a descriptionEn value is a valid, usable translation.
 *
 * Invalid values: null, undefined, empty string, whitespace-only,
 * or the literal strings "null" / "undefined".
 */
function isValidTranslation(value: string | null | undefined): value is string {
  if (value === null || value === undefined) return false;
  if (value.trim() === '') return false;
  if (value === 'null' || value === 'undefined') return false;
  return true;
}

/**
 * Resolves which text to display and which badge to show based on locale
 * and the availability of a valid English translation.
 *
 * @param description - The original Dutch description text
 * @param descriptionEn - The DeepL-translated English text (may be null/invalid)
 * @param locale - The active display language ('nl' or 'en')
 * @returns A TranslationState with the resolved text and badge indicator
 *
 * Defensive: if `description` is null/undefined/empty, returns empty text
 * without throwing.
 */
export function resolveTranslation(
  description: string,
  descriptionEn: string | null,
  locale: Locale,
): TranslationState {
  // Defensive: handle null/undefined/empty description without throwing
  if (!description || description.trim() === '') {
    return { text: '', badge: 'none' };
  }

  // Dutch users always see the original text, no badge needed
  if (locale === 'nl') {
    return { text: description, badge: 'none' };
  }

  // English mode: attempt to show translation
  if (isValidTranslation(descriptionEn)) {
    return { text: descriptionEn, badge: 'translated' };
  }

  // Fallback: show original NL text with indicator badge
  return { text: description, badge: 'original-nl' };
}
