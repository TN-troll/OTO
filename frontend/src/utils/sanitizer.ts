/**
 * HTML Sanitizer for translated description content.
 *
 * Allowlist-based sanitizer that strips dangerous HTML elements and attributes
 * while preserving safe formatting tags. Designed to produce output safe for
 * use with React's `dangerouslySetInnerHTML`.
 */

/** Elements allowed to remain in the output */
const ALLOWED_ELEMENTS = new Set([
  'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li',
]);

/** Elements whose content AND tag are completely removed (not just stripped) */
const REMOVED_ELEMENTS = new Set([
  'script', 'iframe', 'object', 'embed', 'form', 'base', 'meta',
]);

/** Void elements that never have closing tags */
const VOID_ELEMENTS = new Set([
  'br', 'hr', 'img', 'input', 'link', 'meta', 'base', 'embed',
  'col', 'area', 'source', 'track', 'wbr',
]);

/** Dangerous href protocols that should be stripped */
const DANGEROUS_PROTOCOLS = /^\s*(javascript|data|vbscript)\s*:/i;

/**
 * Sanitizes raw HTML for safe rendering via `dangerouslySetInnerHTML`.
 *
 * - Strips all script, iframe, object, embed, form, base, meta elements entirely
 * - Preserves safe formatting: p, br, strong, em, a, ul, ol, li
 * - Forces `rel="noopener noreferrer"` and `target="_blank"` on all anchor tags
 * - Removes inline event handlers (on*) and style attributes
 * - Replaces dangerous href protocols (javascript:, data:, vbscript:) with empty href
 * - Strips disallowed elements while retaining their text content
 *
 * @param rawHtml - The raw HTML string to sanitize
 * @returns Sanitized HTML safe for dangerouslySetInnerHTML
 */
export function sanitizeHtmlDescription(rawHtml: string): string {
  if (!rawHtml) return '';

  // Use a simple state-machine parser to process HTML token by token.
  // This avoids needing a DOM dependency and keeps the bundle small.
  let result = '';
  let i = 0;
  const len = rawHtml.length;

  // Stack to track removed elements (script, iframe, etc.) — we skip their content entirely
  let removedDepth = 0;
  let removedStack: string[] = [];

  while (i < len) {
    if (rawHtml[i] === '<') {
      // Find the end of this tag, respecting quoted attribute values
      const tagEnd = findTagEnd(rawHtml, i + 1);
      if (tagEnd === -1) {
        // Malformed — no closing '>', treat rest as text
        if (removedDepth === 0) {
          result += escapeHtml(rawHtml.slice(i));
        }
        break;
      }

      const tagContent = rawHtml.slice(i + 1, tagEnd);
      i = tagEnd + 1;

      // Check for comments — strip them
      if (tagContent.startsWith('!--')) {
        const commentEnd = rawHtml.indexOf('-->', i - 1);
        if (commentEnd !== -1) {
          i = commentEnd + 3;
        }
        continue;
      }

      // Parse the tag name and determine if it's a closing tag
      const isClosing = tagContent.startsWith('/');
      const tagBody = isClosing ? tagContent.slice(1) : tagContent;
      const tagName = parseTagName(tagBody).toLowerCase();

      if (!tagName) {
        // Not a valid tag, skip
        continue;
      }

      // Handle removed elements (strip tag AND content)
      if (REMOVED_ELEMENTS.has(tagName)) {
        if (isClosing) {
          if (removedStack.length > 0 && removedStack[removedStack.length - 1] === tagName) {
            removedStack.pop();
            removedDepth--;
          }
        } else {
          // Void elements never have content or closing tags
          if (!VOID_ELEMENTS.has(tagName) && !isSelfClosing(tagContent)) {
            removedStack.push(tagName);
            removedDepth++;
          }
        }
        continue;
      }

      // If we're inside a removed element, skip everything
      if (removedDepth > 0) {
        continue;
      }

      // Handle allowed elements
      if (ALLOWED_ELEMENTS.has(tagName)) {
        if (isClosing) {
          result += `</${tagName}>`;
        } else {
          result += buildSanitizedTag(tagName, tagBody);
        }
      }
      // Disallowed elements: strip the tag but keep processing
      // (their text content will be captured in the text node handling below)
    } else {
      // Text node
      if (removedDepth === 0) {
        // Find the next tag start
        const nextTag = rawHtml.indexOf('<', i);
        if (nextTag === -1) {
          result += rawHtml.slice(i);
          break;
        } else {
          result += rawHtml.slice(i, nextTag);
          i = nextTag;
        }
      } else {
        // Inside removed element — skip text content
        const nextTag = rawHtml.indexOf('<', i);
        if (nextTag === -1) {
          break;
        }
        i = nextTag;
      }
    }
  }

  return result;
}

/**
 * Extracts the tag name from the tag body (everything between < and >).
 */
function parseTagName(tagBody: string): string {
  const trimmed = tagBody.trim();
  // Tag name ends at first whitespace, slash, or end of string
  const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
  return match ? match[1] : '';
}

/**
 * Finds the index of the closing '>' for a tag, respecting quoted attribute values.
 * Starts searching from the character after '<'.
 */
function findTagEnd(html: string, start: number): number {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inSingleQuote) {
      if (ch === "'") inSingleQuote = false;
    } else if (inDoubleQuote) {
      if (ch === '"') inDoubleQuote = false;
    } else if (ch === "'") {
      inSingleQuote = true;
    } else if (ch === '"') {
      inDoubleQuote = true;
    } else if (ch === '>') {
      return i;
    }
  }

  return -1;
}

/**
 * Checks if a tag is self-closing (ends with / before >).
 */
function isSelfClosing(tagContent: string): boolean {
  return tagContent.trimEnd().endsWith('/');
}

/**
 * Builds a sanitized opening tag with only safe attributes.
 * For anchor tags, forces rel and target attributes and validates href.
 */
function buildSanitizedTag(tagName: string, tagBody: string): string {
  if (tagName === 'br') {
    return '<br>';
  }

  if (tagName === 'a') {
    const href = extractAttribute(tagBody, 'href');
    let safeHref = '';

    if (href !== null) {
      // Check for dangerous protocols
      if (DANGEROUS_PROTOCOLS.test(href)) {
        safeHref = '';
      } else {
        safeHref = escapeAttribute(href);
      }
    }

    return `<a href="${safeHref}" rel="noopener noreferrer" target="_blank">`;
  }

  // For all other allowed elements, output just the tag name (no attributes)
  return `<${tagName}>`;
}

/**
 * Extracts the value of a named attribute from tag body text.
 * Handles both single-quoted, double-quoted, and unquoted values.
 */
function extractAttribute(tagBody: string, attrName: string): string | null {
  // Match attribute with double quotes, single quotes, or unquoted
  const patterns = [
    new RegExp(`${attrName}\\s*=\\s*"([^"]*)"`, 'i'),
    new RegExp(`${attrName}\\s*=\\s*'([^']*)'`, 'i'),
    new RegExp(`${attrName}\\s*=\\s*([^\\s>]+)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = tagBody.match(pattern);
    if (match) {
      return decodeHtmlEntities(match[1]);
    }
  }

  return null;
}

/**
 * Escapes an attribute value for safe insertion into an HTML attribute.
 */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escapes text content to prevent HTML injection.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Decodes common HTML entities in attribute values.
 */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#47;/g, '/');
}
