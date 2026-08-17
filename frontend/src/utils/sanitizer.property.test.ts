import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeHtmlDescription } from './sanitizer';

/**
 * Property 4: Sanitizer Dangerous Element Removal
 * Validates: Requirements 3.1, 3.4
 *
 * For any input HTML string, the sanitizer output SHALL never contain script,
 * iframe, object, or embed elements, and SHALL never contain any inline event
 * handler attributes (onclick, onerror, onload, etc.) regardless of the input content.
 */
describe('Property 4: Sanitizer Dangerous Element Removal', () => {
  /** Dangerous elements that must be completely removed */
  const DANGEROUS_ELEMENTS = ['script', 'iframe', 'object', 'embed'] as const;

  /** Common inline event handler attributes */
  const EVENT_HANDLERS = [
    'onclick',
    'onerror',
    'onload',
    'onmouseover',
    'onmouseout',
    'onfocus',
    'onblur',
    'onsubmit',
    'onkeydown',
    'onkeyup',
    'onchange',
    'oninput',
    'ondblclick',
    'oncontextmenu',
    'onresize',
  ] as const;

  /**
   * Generator for random text content (no angle brackets to keep it simple payload).
   */
  const safeTextArb = fc.string({ minLength: 0, maxLength: 50 }).map((s) =>
    s.replace(/[<>]/g, '')
  );

  /**
   * Generator for arbitrary HTML strings containing dangerous elements
   * with random content inside them.
   */
  const dangerousElementHtmlArb: fc.Arbitrary<string> = fc
    .record({
      element: fc.constantFrom(...DANGEROUS_ELEMENTS),
      content: safeTextArb,
      prefix: safeTextArb,
      suffix: safeTextArb,
    })
    .map(({ element, content, prefix, suffix }) => {
      return `<p>${prefix}</p><${element}>${content}</${element}><p>${suffix}</p>`;
    });

  /**
   * Generator for dangerous elements with attributes.
   */
  const dangerousElementWithAttrsArb: fc.Arbitrary<string> = fc
    .record({
      element: fc.constantFrom(...DANGEROUS_ELEMENTS),
      content: safeTextArb,
      attrName: fc.constantFrom('src', 'type', 'class', 'id', 'data'),
      attrValue: safeTextArb,
    })
    .map(({ element, content, attrName, attrValue }) => {
      return `<${element} ${attrName}="${attrValue}">${content}</${element}>`;
    });

  /**
   * Generator for HTML strings with inline event handlers on various elements.
   */
  const eventHandlerHtmlArb: fc.Arbitrary<string> = fc
    .record({
      tag: fc.constantFrom('p', 'div', 'span', 'a', 'strong', 'em', 'li'),
      handler: fc.constantFrom(...EVENT_HANDLERS),
      handlerValue: safeTextArb,
      content: safeTextArb,
    })
    .map(({ tag, handler, handlerValue, content }) => {
      return `<${tag} ${handler}="${handlerValue}">${content}</${tag}>`;
    });

  /**
   * Generator for multiple event handlers on the same element.
   */
  const multiHandlerHtmlArb: fc.Arbitrary<string> = fc
    .record({
      tag: fc.constantFrom('p', 'div', 'a', 'strong', 'em'),
      handler1: fc.constantFrom('onclick', 'onerror', 'onload'),
      handler2: fc.constantFrom('onmouseover', 'onfocus', 'onblur'),
      value1: safeTextArb,
      value2: safeTextArb,
      content: safeTextArb,
    })
    .map(({ tag, handler1, handler2, value1, value2, content }) => {
      return `<${tag} ${handler1}="${value1}" ${handler2}="${value2}">${content}</${tag}>`;
    });

  /**
   * Generator for nested dangerous elements (dangerous inside safe elements).
   */
  const nestedDangerousArb: fc.Arbitrary<string> = fc
    .record({
      outerTag: fc.constantFrom('p', 'ul', 'ol', 'li', 'strong', 'em'),
      dangerousTag: fc.constantFrom(...DANGEROUS_ELEMENTS),
      innerContent: safeTextArb,
      outerContent: safeTextArb,
    })
    .map(({ outerTag, dangerousTag, innerContent, outerContent }) => {
      return `<${outerTag}>${outerContent}<${dangerousTag}>${innerContent}</${dangerousTag}></${outerTag}>`;
    });

  /**
   * Asserts no dangerous element tags are present in the output.
   */
  function assertNoDangerousElements(output: string): void {
    for (const element of DANGEROUS_ELEMENTS) {
      // Check for opening tags (with or without attributes)
      expect(output.toLowerCase()).not.toMatch(
        new RegExp(`<${element}(\\s|>|/)`, 'i')
      );
      // Check for closing tags
      expect(output.toLowerCase()).not.toContain(`</${element}>`);
    }
  }

  /**
   * Asserts no on* event handler attributes are present in actual HTML tags
   * in the output. Escaped text content (e.g. &lt;p onclick=...) is safe
   * because it renders as plain text, not as executable HTML.
   */
  function assertNoEventHandlers(output: string): void {
    // Extract actual HTML tags (not escaped ones) and check for event handlers
    const tagRegex = /<[^>]+>/g;
    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(output)) !== null) {
      const tag = match[0];
      // Check this actual HTML tag doesn't contain on* event handler attributes
      expect(tag).not.toMatch(/\bon[a-z]+\s*=/i);
    }
  }

  it('dangerous elements (script, iframe, object, embed) are removed from output', () => {
    /**
     * Validates: Requirement 3.1
     */
    fc.assert(
      fc.property(dangerousElementHtmlArb, (html) => {
        const output = sanitizeHtmlDescription(html);
        assertNoDangerousElements(output);
      }),
      { numRuns: 200 }
    );
  });

  it('dangerous elements with attributes are removed from output', () => {
    /**
     * Validates: Requirement 3.1
     */
    fc.assert(
      fc.property(dangerousElementWithAttrsArb, (html) => {
        const output = sanitizeHtmlDescription(html);
        assertNoDangerousElements(output);
      }),
      { numRuns: 200 }
    );
  });

  it('inline event handler attributes are stripped from all elements', () => {
    /**
     * Validates: Requirement 3.4 (part: event handlers)
     */
    fc.assert(
      fc.property(eventHandlerHtmlArb, (html) => {
        const output = sanitizeHtmlDescription(html);
        assertNoEventHandlers(output);
      }),
      { numRuns: 200 }
    );
  });

  it('multiple event handlers on the same element are all stripped', () => {
    /**
     * Validates: Requirement 3.4 (part: event handlers)
     */
    fc.assert(
      fc.property(multiHandlerHtmlArb, (html) => {
        const output = sanitizeHtmlDescription(html);
        assertNoEventHandlers(output);
      }),
      { numRuns: 200 }
    );
  });

  it('nested dangerous elements inside safe elements are removed', () => {
    /**
     * Validates: Requirements 3.1, 3.4
     */
    fc.assert(
      fc.property(nestedDangerousArb, (html) => {
        const output = sanitizeHtmlDescription(html);
        assertNoDangerousElements(output);
      }),
      { numRuns: 200 }
    );
  });

  it('combined: arbitrary HTML with both dangerous elements and event handlers', () => {
    /**
     * Validates: Requirements 3.1, 3.4
     *
     * Generate complex HTML combining dangerous elements AND event handlers
     * to ensure both threats are neutralized simultaneously.
     */
    const combinedArb = fc
      .record({
        dangerousTag: fc.constantFrom(...DANGEROUS_ELEMENTS),
        safeTag: fc.constantFrom('p', 'a', 'strong', 'em', 'li'),
        handler: fc.constantFrom(...EVENT_HANDLERS),
        content1: safeTextArb,
        content2: safeTextArb,
        handlerValue: safeTextArb,
      })
      .map(({ dangerousTag, safeTag, handler, content1, content2, handlerValue }) => {
        return `<${safeTag} ${handler}="${handlerValue}">${content1}</${safeTag}><${dangerousTag}>${content2}</${dangerousTag}>`;
      });

    fc.assert(
      fc.property(combinedArb, (html) => {
        const output = sanitizeHtmlDescription(html);
        assertNoDangerousElements(output);
        assertNoEventHandlers(output);
      }),
      { numRuns: 200 }
    );
  });
});


/**
 * Property 5: Sanitizer Safe Element Preservation
 * Validates: Requirements 3.2, 3.3
 *
 * For any input HTML string containing only safe formatting elements
 * (p, br, strong, em, a, ul, ol, li), the sanitizer SHALL preserve those
 * elements in the output. All anchor tags in the output SHALL have
 * rel="noopener noreferrer" and target="_blank" attributes.
 */
describe('Property 5: Sanitizer Safe Element Preservation', () => {
  /** Safe elements that the sanitizer must preserve */
  const SAFE_ELEMENTS = ['p', 'strong', 'em', 'ul', 'ol', 'li'] as const;

  /**
   * Generator for random text content without angle brackets or ampersands
   * to ensure we're only testing element preservation (not entity handling).
   */
  const safeTextArb = fc
    .string({ minLength: 1, maxLength: 30 })
    .map((s) => s.replace(/[<>&"']/g, 'x'));

  /**
   * Generator for a single safe element wrapping text content.
   */
  const safeElementArb: fc.Arbitrary<{ html: string; tag: string }> = fc
    .record({
      tag: fc.constantFrom(...SAFE_ELEMENTS),
      content: safeTextArb,
    })
    .map(({ tag, content }) => ({
      html: `<${tag}>${content}</${tag}>`,
      tag,
    }));

  /**
   * Generator for a <br> element (void, no closing tag).
   */
  const brElementArb: fc.Arbitrary<{ html: string; tag: string }> = fc.constant({
    html: '<br>',
    tag: 'br',
  });

  /**
   * Generator for anchor tags with safe href values.
   */
  const anchorElementArb: fc.Arbitrary<{ html: string; tag: string }> = fc
    .record({
      href: fc.webUrl(),
      content: safeTextArb,
    })
    .map(({ href, content }) => ({
      html: `<a href="${href}">${content}</a>`,
      tag: 'a',
    }));

  /**
   * Generator for a complete HTML document using only safe elements.
   * Produces a sequence of safe elements concatenated together.
   */
  const safeHtmlDocArb: fc.Arbitrary<{ html: string; tags: string[] }> = fc
    .array(
      fc.oneof(
        { weight: 4, arbitrary: safeElementArb },
        { weight: 1, arbitrary: brElementArb },
        { weight: 2, arbitrary: anchorElementArb }
      ),
      { minLength: 1, maxLength: 6 }
    )
    .map((elements) => ({
      html: elements.map((e) => e.html).join(''),
      tags: elements.map((e) => e.tag),
    }));

  /**
   * Generator for nested safe elements (e.g., <ul><li>text</li></ul>).
   */
  const nestedSafeHtmlArb: fc.Arbitrary<{ html: string; tags: string[] }> = fc
    .record({
      outerTag: fc.constantFrom('p', 'ul', 'ol', 'li'),
      innerTag: fc.constantFrom('strong', 'em'),
      content: safeTextArb,
    })
    .map(({ outerTag, innerTag, content }) => ({
      html: `<${outerTag}><${innerTag}>${content}</${innerTag}></${outerTag}>`,
      tags: [outerTag, innerTag],
    }));

  /**
   * Extracts all HTML tag names from a string (both opening and self-closing).
   */
  function extractOpeningTags(html: string): string[] {
    const tags: string[] = [];
    const regex = /<([a-z][a-z0-9]*)\b[^>]*\/?>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      tags.push(match[1].toLowerCase());
    }
    return tags;
  }

  /**
   * Asserts all anchor tags in the output have the required security attributes.
   */
  function assertAnchorAttributes(output: string): void {
    const anchorRegex = /<a\b[^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = anchorRegex.exec(output)) !== null) {
      const tag = match[0];
      expect(tag).toContain('rel="noopener noreferrer"');
      expect(tag).toContain('target="_blank"');
    }
  }

  it('safe elements (p, br, strong, em, ul, ol, li) are preserved in the output', () => {
    /**
     * Validates: Requirement 3.2
     */
    fc.assert(
      fc.property(safeHtmlDocArb, ({ html, tags }) => {
        const output = sanitizeHtmlDescription(html);
        const outputTags = extractOpeningTags(output);

        // Every safe element from the input should appear in the output
        for (const tag of tags) {
          expect(outputTags).toContain(tag);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('nested safe elements are preserved in the output', () => {
    /**
     * Validates: Requirement 3.2
     */
    fc.assert(
      fc.property(nestedSafeHtmlArb, ({ html, tags }) => {
        const output = sanitizeHtmlDescription(html);
        const outputTags = extractOpeningTags(output);

        for (const tag of tags) {
          expect(outputTags).toContain(tag);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('all anchor tags in the output have rel="noopener noreferrer" and target="_blank"', () => {
    /**
     * Validates: Requirement 3.3
     */
    fc.assert(
      fc.property(anchorElementArb, ({ html }) => {
        const output = sanitizeHtmlDescription(html);
        assertAnchorAttributes(output);
      }),
      { numRuns: 200 }
    );
  });

  it('anchor tags within mixed safe element documents have correct attributes', () => {
    /**
     * Validates: Requirements 3.2, 3.3
     */
    fc.assert(
      fc.property(safeHtmlDocArb, ({ html, tags }) => {
        const output = sanitizeHtmlDescription(html);

        // Check element preservation
        const outputTags = extractOpeningTags(output);
        for (const tag of tags) {
          expect(outputTags).toContain(tag);
        }

        // Check anchor attributes
        assertAnchorAttributes(output);
      }),
      { numRuns: 200 }
    );
  });

  it('safe elements with text content preserve the text content in the output', () => {
    /**
     * Validates: Requirement 3.2
     */
    fc.assert(
      fc.property(
        fc.record({
          tag: fc.constantFrom(...SAFE_ELEMENTS),
          content: safeTextArb,
        }),
        ({ tag, content }) => {
          const html = `<${tag}>${content}</${tag}>`;
          const output = sanitizeHtmlDescription(html);
          expect(output).toContain(content);
        }
      ),
      { numRuns: 200 }
    );
  });
});
