import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateMonthlyPayment } from './finance';

/**
 * Property 8: Finance Calculator Amortization Formula
 *
 * For any valid combination of listing price (> 0), down payment percentage (0–99%),
 * loan term (12–84 months), and annual interest rate (0.01–15%), the finance calculator
 * SHALL compute the monthly payment as M = P × [r(1+r)^n] / [(1+r)^n – 1],
 * where P = price × (1 – downPaymentPercent/100), r = annualRate/12/100, n = loanTermMonths.
 * The result SHALL be accurate to two decimal places.
 *
 * Validates: Requirements 6.4
 */

describe('Property 8: Finance Calculator Amortization Formula', () => {
  // Generators for valid inputs
  const arbPrice = fc.double({ min: 1000, max: 500000, noNaN: true, noDefaultInfinity: true });
  const arbDownPayment = fc.integer({ min: 0, max: 99 });
  const arbLoanTerm = fc.integer({ min: 12, max: 84 });
  const arbRate = fc.double({ min: 0.01, max: 15, noNaN: true, noDefaultInfinity: true });

  it('monthly payment matches the standard amortization formula to 2 decimal places', () => {
    fc.assert(
      fc.property(arbPrice, arbDownPayment, arbLoanTerm, arbRate, (price, downPct, months, rate) => {
        const result = calculateMonthlyPayment(price, downPct, months, rate);

        // Compute expected using the amortization formula
        const P = price * (1 - downPct / 100);
        const r = rate / 12 / 100;
        const n = months;
        const compoundFactor = Math.pow(1 + r, n);
        const expectedMonthly = P * (r * compoundFactor) / (compoundFactor - 1);

        // Round to 2 decimal places for comparison
        const expectedRounded = Math.round(expectedMonthly * 100) / 100;

        expect(result.monthlyPayment).toBe(expectedRounded);
      }),
      { numRuns: 100 },
    );
  });

  it('principal equals price × (1 - downPaymentPercent / 100)', () => {
    fc.assert(
      fc.property(arbPrice, arbDownPayment, arbLoanTerm, arbRate, (price, downPct, months, rate) => {
        const result = calculateMonthlyPayment(price, downPct, months, rate);

        const expectedPrincipal = price * (1 - downPct / 100);
        const expectedRounded = Math.round(expectedPrincipal * 100) / 100;

        expect(result.principal).toBe(expectedRounded);
      }),
      { numRuns: 100 },
    );
  });

  it('monthly payment is always positive for valid inputs with rate > 0 and downPayment < 100', () => {
    fc.assert(
      fc.property(arbPrice, arbDownPayment, arbLoanTerm, arbRate, (price, downPct, months, rate) => {
        const result = calculateMonthlyPayment(price, downPct, months, rate);

        expect(result.monthlyPayment).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('result is accurate to exactly two decimal places (no more precision)', () => {
    fc.assert(
      fc.property(arbPrice, arbDownPayment, arbLoanTerm, arbRate, (price, downPct, months, rate) => {
        const result = calculateMonthlyPayment(price, downPct, months, rate);

        // monthlyPayment should have at most 2 decimal places
        const rounded = Math.round(result.monthlyPayment * 100) / 100;
        expect(result.monthlyPayment).toBe(rounded);

        // principal should also be rounded to 2 decimal places
        const principalRounded = Math.round(result.principal * 100) / 100;
        expect(result.principal).toBe(principalRounded);
      }),
      { numRuns: 100 },
    );
  });
});
