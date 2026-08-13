import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateMonthlyPayment, clamp } from './finance';

/**
 * Property 9: Finance Calculator Input Validation
 * Validates: Requirements 6.2, 6.6
 *
 * For any down payment percentage outside [0, 100], loan term outside [12, 84] months,
 * or interest rate outside [0, 15]%, the finance calculator SHALL reject or clamp the value.
 * When down payment equals 100%, the calculator SHALL display "No financing needed"
 * instead of computing a payment.
 */
describe('Property 9: Finance Calculator Input Validation', () => {
  const validPrice = fc.double({ min: 1000, max: 500000, noNaN: true, noDefaultInfinity: true });

  it('out-of-range down payment is clamped to [0, 100]', () => {
    /**
     * Validates: Requirements 6.2
     *
     * For any down payment percentage outside [0, 100], the result should be
     * equivalent to the result with the clamped value.
     */
    fc.assert(
      fc.property(
        validPrice,
        fc.oneof(
          fc.double({ min: -1000, max: -0.01, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 100.01, max: 1000, noNaN: true, noDefaultInfinity: true })
        ),
        fc.integer({ min: 12, max: 84 }),
        fc.double({ min: 0, max: 15, noNaN: true, noDefaultInfinity: true }),
        (price, outOfRangeDown, term, rate) => {
          const result = calculateMonthlyPayment(price, outOfRangeDown, term, rate);
          const clampedDown = clamp(outOfRangeDown, 0, 100);
          const expected = calculateMonthlyPayment(price, clampedDown, term, rate);

          expect(result.monthlyPayment).toBe(expected.monthlyPayment);
          expect(result.principal).toBe(expected.principal);
          expect(result.totalInterest).toBe(expected.totalInterest);
          expect(result.totalCost).toBe(expected.totalCost);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('out-of-range loan term is clamped to [12, 84]', () => {
    /**
     * Validates: Requirements 6.2
     *
     * For any loan term outside [12, 84] months, the result should be
     * equivalent to the result with the clamped value.
     */
    fc.assert(
      fc.property(
        validPrice,
        fc.double({ min: 0, max: 99, noNaN: true, noDefaultInfinity: true }),
        fc.oneof(
          fc.integer({ min: -100, max: 11 }),
          fc.integer({ min: 85, max: 360 })
        ),
        fc.double({ min: 0, max: 15, noNaN: true, noDefaultInfinity: true }),
        (price, down, outOfRangeTerm, rate) => {
          const result = calculateMonthlyPayment(price, down, outOfRangeTerm, rate);
          const clampedTerm = clamp(outOfRangeTerm, 12, 84);
          const expected = calculateMonthlyPayment(price, down, clampedTerm, rate);

          expect(result.monthlyPayment).toBe(expected.monthlyPayment);
          expect(result.principal).toBe(expected.principal);
          expect(result.totalInterest).toBe(expected.totalInterest);
          expect(result.totalCost).toBe(expected.totalCost);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('out-of-range interest rate is clamped to [0, 15]', () => {
    /**
     * Validates: Requirements 6.2
     *
     * For any interest rate outside [0, 15]%, the result should be
     * equivalent to the result with the clamped value.
     */
    fc.assert(
      fc.property(
        validPrice,
        fc.double({ min: 0, max: 99, noNaN: true, noDefaultInfinity: true }),
        fc.integer({ min: 12, max: 84 }),
        fc.oneof(
          fc.double({ min: -100, max: -0.01, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: 15.01, max: 100, noNaN: true, noDefaultInfinity: true })
        ),
        (price, down, term, outOfRangeRate) => {
          const result = calculateMonthlyPayment(price, down, term, outOfRangeRate);
          const clampedRate = clamp(outOfRangeRate, 0, 15);
          const expected = calculateMonthlyPayment(price, down, term, clampedRate);

          expect(result.monthlyPayment).toBe(expected.monthlyPayment);
          expect(result.principal).toBe(expected.principal);
          expect(result.totalInterest).toBe(expected.totalInterest);
          expect(result.totalCost).toBe(expected.totalCost);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when down payment is 100%, monthlyPayment equals 0 and principal equals 0', () => {
    /**
     * Validates: Requirements 6.6
     *
     * When down payment equals 100%, the calculator SHALL display
     * "No financing needed" — meaning principal = 0 and monthlyPayment = 0.
     */
    fc.assert(
      fc.property(
        validPrice,
        fc.integer({ min: 12, max: 84 }),
        fc.double({ min: 0, max: 15, noNaN: true, noDefaultInfinity: true }),
        (price, term, rate) => {
          const result = calculateMonthlyPayment(price, 100, term, rate);

          expect(result.principal).toBe(0);
          expect(result.monthlyPayment).toBe(0);
          expect(result.totalInterest).toBe(0);
          expect(result.totalCost).toBe(price);
        }
      ),
      { numRuns: 100 }
    );
  });
});
