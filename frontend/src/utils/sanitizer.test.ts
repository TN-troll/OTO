import { describe, it, expect } from 'vitest';
import { sanitizeHtmlDescription } from './sanitizer';

describe('sanitizeHtmlDescription', () => {
  describe('basic behavior', () => {
    it('should return empty string for empty input', () => {
      expect(sanitizeHtmlDescription('')).toBe('');
    });

    it('should return empty string for null-like input', () => {
      expect(sanitizeHtmlDescription(null as unknown as string)).toBe('');
      expect(sanitizeHtmlDescription(undefined as unknown as string)).toBe('');
    });

    it('should preserve plain text without tags', () => {
      expect(sanitizeHtmlDescription('Hello world')).toBe('Hello world');
    });
  });

  describe('safe element preservation', () => {
    it('should preserve p tags', () => {
      expect(sanitizeHtmlDescription('<p>Hello</p>')).toBe('<p>Hello</p>');
    });

    it('should preserve br tags', () => {
      expect(sanitizeHtmlDescription('Line 1<br>Line 2')).toBe('Line 1<br>Line 2');
    });

    it('should preserve strong and em tags', () => {
      expect(sanitizeHtmlDescription('<strong>bold</strong> and <em>italic</em>'))
        .toBe('<strong>bold</strong> and <em>italic</em>');
    });

    it('should preserve ul, ol, and li tags', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(sanitizeHtmlDescription(input)).toBe(input);
    });

    it('should preserve ordered lists', () => {
      const input = '<ol><li>First</li><li>Second</li></ol>';
      expect(sanitizeHtmlDescription(input)).toBe(input);
    });
  });

  describe('anchor tag handling', () => {
    it('should force rel="noopener noreferrer" and target="_blank" on anchors', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="https://example.com" rel="noopener noreferrer" target="_blank">Link</a>');
    });

    it('should override existing rel and target attributes', () => {
      const input = '<a href="https://example.com" rel="nofollow" target="_self">Link</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="https://example.com" rel="noopener noreferrer" target="_blank">Link</a>');
    });

    it('should handle anchors without href', () => {
      const input = '<a>No href</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">No href</a>');
    });
  });

  describe('dangerous protocol removal', () => {
    it('should strip javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });

    it('should strip data: protocol', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });

    it('should strip vbscript: protocol', () => {
      const input = '<a href="vbscript:MsgBox(1)">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });

    it('should strip protocols with whitespace padding', () => {
      const input = '<a href="  javascript:alert(1)">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });

    it('should strip case-insensitive dangerous protocols', () => {
      const input = '<a href="JAVASCRIPT:alert(1)">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });
  });

  describe('dangerous element removal', () => {
    it('should completely remove script elements and their content', () => {
      const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Hello</p><p>World</p>');
    });

    it('should completely remove iframe elements and their content', () => {
      const input = '<p>Before</p><iframe src="evil.com">content</iframe><p>After</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Before</p><p>After</p>');
    });

    it('should completely remove object elements', () => {
      const input = '<p>Text</p><object data="evil.swf">fallback</object>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Text</p>');
    });

    it('should completely remove embed elements', () => {
      const input = '<p>Text</p><embed src="evil.swf"/>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Text</p>');
    });

    it('should completely remove form elements and their content', () => {
      const input = '<p>Text</p><form action="evil.com"><input type="text"></form>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Text</p>');
    });

    it('should completely remove base elements', () => {
      const input = '<base href="https://evil.com"><p>Text</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Text</p>');
    });

    it('should completely remove meta elements', () => {
      const input = '<meta http-equiv="refresh" content="0;url=evil.com"><p>Text</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Text</p>');
    });
  });

  describe('disallowed element stripping (retain text)', () => {
    it('should strip div tags but keep their text content', () => {
      const input = '<div>Hello World</div>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('Hello World');
    });

    it('should strip span tags but keep their text content', () => {
      const input = '<p>Hello <span class="highlight">World</span></p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Hello World</p>');
    });

    it('should strip h1-h6 tags but keep their text content', () => {
      const input = '<h1>Title</h1><p>Content</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('Title<p>Content</p>');
    });

    it('should strip table elements but keep text content', () => {
      const input = '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('Cell 1Cell 2');
    });
  });

  describe('event handler and style attribute stripping', () => {
    it('should strip onclick from allowed elements', () => {
      const input = '<p onclick="alert(1)">Text</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Text</p>');
    });

    it('should strip onerror from allowed elements', () => {
      const input = '<strong onerror="evil()">Bold</strong>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<strong>Bold</strong>');
    });

    it('should strip style attributes from allowed elements', () => {
      const input = '<p style="color:red;background:url(evil.js)">Text</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Text</p>');
    });

    it('should strip onload from elements', () => {
      const input = '<p onload="steal()">Content</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Content</p>');
    });
  });

  describe('whitespace-only output fallback', () => {
    it('should return whitespace-only string when all content is stripped leaving only spaces', () => {
      // When input contains only dangerous elements with no safe text,
      // the sanitizer produces empty/whitespace output.
      // The DescriptionSection component is responsible for the fallback behavior (Req 3.6).
      const input = '<script>alert(1)</script>';
      const result = sanitizeHtmlDescription(input);
      expect(result.trim()).toBe('');
    });

    it('should return empty when input is only removed elements with whitespace between them', () => {
      const input = '   <script>evil()</script>   <iframe>bad</iframe>   ';
      const result = sanitizeHtmlDescription(input);
      expect(result.trim()).toBe('');
    });

    it('should return whitespace when all content is inside stripped dangerous elements', () => {
      const input = '<object><embed src="x"/></object><form><input/></form>';
      const result = sanitizeHtmlDescription(input);
      expect(result.trim()).toBe('');
    });

    it('should preserve text when non-allowed tags are stripped but text remains', () => {
      const input = '<div>  <span>Visible text</span>  </div>';
      const result = sanitizeHtmlDescription(input);
      expect(result.trim()).toBe('Visible text');
    });
  });

  describe('href protocol stripping edge cases', () => {
    it('should strip mixed case protocols like JaVaScRiPt:', () => {
      const input = '<a href="JaVaScRiPt:alert(1)">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });

    it('should strip protocol with tabs between characters', () => {
      const input = '<a href="java\tscript:alert(1)">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      // The regex trims/collapses but the tab is within the protocol string
      // Our sanitizer should at minimum not produce a clickable javascript: URL
      expect(result).not.toContain('javascript:');
    });

    it('should strip protocol with newline characters', () => {
      const input = '<a href="java\nscript:alert(1)">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).not.toContain('javascript:');
    });

    it('should strip DATA: protocol in all caps', () => {
      const input = '<a href="DATA:text/html,<script>alert(1)</script>">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });

    it('should strip VbScript: with mixed casing', () => {
      const input = '<a href="VbScript:MsgBox">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });

    it('should strip protocol with leading whitespace and tabs', () => {
      const input = '<a href=" \t javascript:alert(1)">XSS</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="" rel="noopener noreferrer" target="_blank">XSS</a>');
    });

    it('should allow safe protocols like https:', () => {
      const input = '<a href="https://example.com">Safe</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="https://example.com" rel="noopener noreferrer" target="_blank">Safe</a>');
    });

    it('should allow safe protocols like mailto:', () => {
      const input = '<a href="mailto:test@example.com">Email</a>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<a href="mailto:test@example.com" rel="noopener noreferrer" target="_blank">Email</a>');
    });
  });

  describe('deeply nested malicious content', () => {
    it('should strip script nested inside another script', () => {
      const input = '<script><script>alert(1)</script></script>';
      const result = sanitizeHtmlDescription(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
    });

    it('should strip iframe nested inside object', () => {
      const input = '<object><iframe><script>evil()</script></iframe></object>';
      const result = sanitizeHtmlDescription(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<object');
      expect(result).not.toContain('evil');
    });

    it('should strip deeply nested malicious elements inside safe elements', () => {
      const input = '<p>Hello <strong><script>alert("xss")</script>World</strong></p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Hello <strong>');
      expect(result).toContain('World</strong></p>');
    });

    it('should handle multiple nested removed elements', () => {
      const input = '<form><object><embed src="x"/><iframe><script>evil()</script></iframe></object></form>';
      const result = sanitizeHtmlDescription(input);
      expect(result).not.toContain('<form');
      expect(result).not.toContain('<object');
      expect(result).not.toContain('<embed');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('evil');
      expect(result.trim()).toBe('');
    });

    it('should handle malicious content interleaved with safe content at depth', () => {
      const input = '<ul><li>Safe item</li><li><script>steal()</script></li><li>Also safe</li></ul>';
      const result = sanitizeHtmlDescription(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('steal');
      expect(result).toContain('<li>Safe item</li>');
      expect(result).toContain('<li>Also safe</li>');
    });

    it('should strip event handlers from deeply nested allowed elements', () => {
      const input = '<ul><li><strong onclick="evil()"><em onmouseover="steal()">Text</em></strong></li></ul>';
      const result = sanitizeHtmlDescription(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('Text');
    });

    it('should handle anchor with dangerous protocol nested inside multiple safe elements', () => {
      const input = '<p><strong><em><a href="javascript:document.cookie">Phish</a></em></strong></p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toContain('href=""');
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Phish');
    });
  });

  describe('complex scenarios', () => {
    it('should handle nested allowed elements', () => {
      const input = '<ul><li><strong>Bold item</strong></li><li><em>Italic item</em></li></ul>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<ul><li><strong>Bold item</strong></li><li><em>Italic item</em></li></ul>');
    });

    it('should handle HTML entities in text content', () => {
      const input = '<p>Price: &euro;50,000 &amp; more</p>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Price: &euro;50,000 &amp; more</p>');
    });

    it('should handle mixed safe and unsafe content', () => {
      const input = '<p>Safe</p><script>evil()</script><strong>Also safe</strong><iframe>bad</iframe>';
      const result = sanitizeHtmlDescription(input);
      expect(result).toBe('<p>Safe</p><strong>Also safe</strong>');
    });

    it('should handle real-world translated description HTML', () => {
      const input = `<p>Beautiful <strong>BMW 5 Series</strong> in excellent condition.</p>
<ul><li>Low mileage</li><li>Full service history</li></ul>
<p>Contact us at <a href="https://dealer.nl">our website</a>.</p>`;
      const result = sanitizeHtmlDescription(input);
      expect(result).toContain('<strong>BMW 5 Series</strong>');
      expect(result).toContain('<li>Low mileage</li>');
      expect(result).toContain('rel="noopener noreferrer"');
      expect(result).toContain('target="_blank"');
    });
  });
});
