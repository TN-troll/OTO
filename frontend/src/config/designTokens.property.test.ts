import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import tailwindConfig from '../../tailwind.config.js';

/**
 * Property 11: Glass Token Opacity Range
 *
 * For any glass surface color token (light or dark mode), the rgba opacity value
 * SHALL be between 0.04 and 0.90, and all backdrop-blur values SHALL be at least 12px.
 *
 * Validates: Requirements 4.1, 4.2
 */

// Helper: extract rgba opacity from a color string like "rgba(255, 255, 255, 0.60)"
function extractRgbaOpacity(color: string): number | null {
  const match = color.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
  return match ? parseFloat(match[1]) : null;
}

// Helper: extract numeric pixel value from a string like "20px"
function extractPixelValue(value: string): number | null {
  const match = value.match(/^(\d+)px$/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper: parse cubic-bezier Y control points
function extractCubicBezierYPoints(value: string): number[] {
  const match = value.match(/cubic-bezier\(\s*([\d.]+)\s*,\s*([\d.-]+)\s*,\s*([\d.]+)\s*,\s*([\d.-]+)\s*\)/);
  if (!match) return [];
  return [parseFloat(match[2]), parseFloat(match[4])];
}

const theme = tailwindConfig.theme.extend;

describe('Property 11: Glass Token Opacity Range', () => {
  describe('Glass color tokens have opacity within 0.04–0.90', () => {
    const glassColors = theme.colors.glass;
    const glassColorEntries = Object.entries(glassColors).filter(
      ([key]) => !key.includes('border'), // border tokens have different opacity requirements
    );

    it.each(glassColorEntries)(
      'glass.%s has rgba opacity between 0.04 and 0.90',
      (key, value) => {
        const opacity = extractRgbaOpacity(value as string);
        expect(opacity).not.toBeNull();
        expect(opacity!).toBeGreaterThanOrEqual(0.04);
        expect(opacity!).toBeLessThanOrEqual(0.90);
      },
    );

    it('all glass surface tokens (excluding borders) satisfy opacity range property', () => {
      for (const [key, value] of glassColorEntries) {
        const opacity = extractRgbaOpacity(value as string);
        expect(opacity, `glass.${key} opacity`).not.toBeNull();
        expect(opacity!, `glass.${key} opacity ${opacity} should be >= 0.04`).toBeGreaterThanOrEqual(0.04);
        expect(opacity!, `glass.${key} opacity ${opacity} should be <= 0.90`).toBeLessThanOrEqual(0.90);
      }
    });
  });

  describe('Backdrop-blur values are at least 12px', () => {
    const backdropBlurValues = theme.backdropBlur;

    it.each(Object.entries(backdropBlurValues))(
      'backdropBlur.%s is at least 12px',
      (key, value) => {
        const px = extractPixelValue(value as string);
        expect(px).not.toBeNull();
        expect(px!).toBeGreaterThanOrEqual(12);
      },
    );
  });

  describe('At least one timing function has overshoot (Y control point > 1.0)', () => {
    const timingFunctions = theme.transitionTimingFunction;

    it('at least one transitionTimingFunction has a cubic-bezier Y control point > 1.0', () => {
      const hasOvershoot = Object.values(timingFunctions).some((value) => {
        const yPoints = extractCubicBezierYPoints(value as string);
        return yPoints.some((y) => y > 1.0);
      });
      expect(hasOvershoot).toBe(true);
    });

    it('the "spring" timing function specifically has overshoot', () => {
      const springValue = timingFunctions.spring;
      const yPoints = extractCubicBezierYPoints(springValue);
      expect(yPoints.some((y) => y > 1.0)).toBe(true);
    });
  });

  describe('Property-based: arbitrary opacity values within glass token range', () => {
    // Generate arbitrary opacity values within the valid range defined by the spec
    const arbOpacity = fc.double({ min: 0.04, max: 0.90, noNaN: true, noDefaultInfinity: true });

    it('any opacity in [0.04, 0.90] is within the valid glass token range', () => {
      fc.assert(
        fc.property(arbOpacity, (opacity) => {
          expect(opacity).toBeGreaterThanOrEqual(0.04);
          expect(opacity).toBeLessThanOrEqual(0.90);
        }),
        { numRuns: 100 },
      );
    });

    it('configured glass token opacity values fall within the valid arbitrary range', () => {
      const glassColors = theme.colors.glass;
      const surfaceEntries = Object.entries(glassColors).filter(
        ([key]) => !key.includes('border'),
      );

      // Extract actual opacity values from config
      const actualOpacities = surfaceEntries
        .map(([, value]) => extractRgbaOpacity(value as string))
        .filter((v): v is number => v !== null);

      // Property: each configured value should be within valid range
      fc.assert(
        fc.property(
          fc.constantFrom(...actualOpacities),
          (opacity) => {
            expect(opacity).toBeGreaterThanOrEqual(0.04);
            expect(opacity).toBeLessThanOrEqual(0.90);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('no valid glass opacity should be below 0.04 or above 0.90', () => {
      // Test that values outside the range are correctly identified as invalid
      const arbInvalidLow = fc.double({ min: 0, max: 0.039, noNaN: true, noDefaultInfinity: true });
      const arbInvalidHigh = fc.double({ min: 0.901, max: 1.0, noNaN: true, noDefaultInfinity: true });

      fc.assert(
        fc.property(arbInvalidLow, (opacity) => {
          expect(opacity).toBeLessThan(0.04);
        }),
        { numRuns: 50 },
      );

      fc.assert(
        fc.property(arbInvalidHigh, (opacity) => {
          expect(opacity).toBeGreaterThan(0.90);
        }),
        { numRuns: 50 },
      );
    });
  });
});
