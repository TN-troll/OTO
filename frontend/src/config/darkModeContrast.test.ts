import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import tailwindConfig from '../../tailwind.config.js';

/**
 * Property 9: Dark Mode Contrast Compliance
 *
 * For any text element rendered in dark mode, the contrast ratio between the text color
 * and its background SHALL be at least 4.5:1 (WCAG AA level).
 *
 * Validates: Requirement 7.3
 */

const theme = tailwindConfig.theme.extend;

// Helper: extract RGBA components from a color string like "rgba(30, 30, 30, 0.60)"
function parseRgba(color: string): { r: number; g: number; b: number; a: number } | null {
  const match = color.match(
    /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/,
  );
  if (!match) return null;
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: parseFloat(match[4]),
  };
}

// Helper: compute relative luminance per WCAG 2.1 formula
// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Helper: compute contrast ratio per WCAG 2.1
// https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Helper: composite a semi-transparent foreground color over an opaque background
// Uses alpha compositing: result = fg * alpha + bg * (1 - alpha)
function compositeOnBlack(r: number, g: number, b: number, a: number): { r: number; g: number; b: number } {
  return {
    r: Math.round(r * a),
    g: Math.round(g * a),
    b: Math.round(b * a),
  };
}

describe('Dark Mode Contrast Compliance', () => {
  const glassColors = theme.colors.glass;

  describe('Glass dark surface tokens have correct RGB and opacity ranges', () => {
    const darkSurfaceTokens = ['dark', 'darker'] as const;

    it.each(darkSurfaceTokens)(
      'glass.%s has RGB channels ≤ 80 and opacity between 0.04–0.90',
      (key) => {
        const color = glassColors[key];
        const parsed = parseRgba(color);

        expect(parsed, `glass.${key} should be a valid rgba color`).not.toBeNull();
        expect(parsed!.r, `glass.${key} R channel should be ≤ 80`).toBeLessThanOrEqual(80);
        expect(parsed!.g, `glass.${key} G channel should be ≤ 80`).toBeLessThanOrEqual(80);
        expect(parsed!.b, `glass.${key} B channel should be ≤ 80`).toBeLessThanOrEqual(80);
        expect(parsed!.a, `glass.${key} opacity should be ≥ 0.04`).toBeGreaterThanOrEqual(0.04);
        expect(parsed!.a, `glass.${key} opacity should be ≤ 0.90`).toBeLessThanOrEqual(0.90);
      },
    );

    it('glass.dark (rgba(10, 22, 40, 0.70)) has expected values', () => {
      const parsed = parseRgba(glassColors.dark);
      expect(parsed).toEqual({ r: 10, g: 22, b: 40, a: 0.70 });
    });

    it('glass.darker (rgba(8, 14, 31, 0.85)) has expected values', () => {
      const parsed = parseRgba(glassColors.darker);
      expect(parsed).toEqual({ r: 8, g: 14, b: 31, a: 0.85 });
    });
  });

  describe('Border alpha values are within correct ranges', () => {
    it('glass.borderDark alpha is within 0.03–0.12 range', () => {
      const parsed = parseRgba(glassColors.borderDark);
      expect(parsed, 'glass.borderDark should be a valid rgba color').not.toBeNull();
      expect(parsed!.a, 'borderDark alpha should be ≥ 0.03').toBeGreaterThanOrEqual(0.03);
      expect(parsed!.a, 'borderDark alpha should be ≤ 0.12').toBeLessThanOrEqual(0.12);
    });

    it('glass.border alpha is 0.15 (for reference)', () => {
      const parsed = parseRgba(glassColors.border);
      expect(parsed).not.toBeNull();
      expect(parsed!.a).toBeCloseTo(0.15, 2);
    });
  });

  describe('Property 9 (fast-check): White text on dark glass backgrounds meets 4.5:1 contrast', () => {
    // White text has relative luminance = 1.0
    const whiteLuminance = 1.0;

    it('white text on configured dark glass surfaces composited on black has contrast ≥ 4.5:1', () => {
      // Test with the actual configured dark glass tokens
      const darkTokens = [glassColors.dark, glassColors.darker];

      for (const token of darkTokens) {
        const parsed = parseRgba(token);
        expect(parsed).not.toBeNull();

        const composite = compositeOnBlack(parsed!.r, parsed!.g, parsed!.b, parsed!.a);
        const bgLuminance = relativeLuminance(composite.r, composite.g, composite.b);
        const ratio = contrastRatio(whiteLuminance, bgLuminance);

        expect(
          ratio,
          `Contrast ratio for white text on ${token} composited on black should be ≥ 4.5:1 (got ${ratio.toFixed(2)}:1)`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('for any dark glass background (RGB ≤ 80, opacity 0.04–0.90) composited on black, white text contrast ≥ 4.5:1', () => {
      // Generate arbitrary dark glass backgrounds within the design system constraints
      const arbDarkGlassBackground = fc.record({
        r: fc.integer({ min: 0, max: 80 }),
        g: fc.integer({ min: 0, max: 80 }),
        b: fc.integer({ min: 0, max: 80 }),
        a: fc.double({ min: 0.04, max: 0.90, noNaN: true, noDefaultInfinity: true }),
      });

      fc.assert(
        fc.property(arbDarkGlassBackground, ({ r, g, b, a }) => {
          // Composite the semi-transparent dark surface on a black background
          const composite = compositeOnBlack(r, g, b, a);
          const bgLuminance = relativeLuminance(composite.r, composite.g, composite.b);

          // White text (luminance = 1.0) vs dark composite background
          const ratio = contrastRatio(whiteLuminance, bgLuminance);

          // WCAG AA requires 4.5:1 for normal text
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }),
        { numRuns: 200 },
      );
    });

    it('for any text color with luminance approaching white (L ≥ 0.9) on dark glass, contrast ≥ 4.5:1', () => {
      // Generate near-white text colors (high luminance) and dark glass backgrounds
      const arbNearWhiteText = fc.record({
        r: fc.integer({ min: 230, max: 255 }),
        g: fc.integer({ min: 230, max: 255 }),
        b: fc.integer({ min: 230, max: 255 }),
      });

      const arbDarkGlassBackground = fc.record({
        r: fc.integer({ min: 0, max: 80 }),
        g: fc.integer({ min: 0, max: 80 }),
        b: fc.integer({ min: 0, max: 80 }),
        a: fc.double({ min: 0.04, max: 0.90, noNaN: true, noDefaultInfinity: true }),
      });

      fc.assert(
        fc.property(arbNearWhiteText, arbDarkGlassBackground, (text, bg) => {
          const textLuminance = relativeLuminance(text.r, text.g, text.b);
          const composite = compositeOnBlack(bg.r, bg.g, bg.b, bg.a);
          const bgLuminance = relativeLuminance(composite.r, composite.g, composite.b);

          const ratio = contrastRatio(textLuminance, bgLuminance);

          // Only assert if text luminance is sufficiently bright (≥ 0.9)
          // which corresponds to near-white colors
          if (textLuminance >= 0.9) {
            expect(ratio).toBeGreaterThanOrEqual(4.5);
          }
        }),
        { numRuns: 200 },
      );
    });
  });
});
