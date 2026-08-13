import { describe, it, expect } from 'vitest';
import { calculateMonthlyPayment, clamp } from './finance';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below minimum', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps above maximum', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('calculateMonthlyPayment', () => {
  describe('standard amortization formula', () => {
    it('computes correct monthly payment for typical loan', () => {
      // €50,000 car, 20% down, 60 months, 4.5% annual rate
      // Principal = 40,000, r = 0.045/12 = 0.00375, n = 60
      const result = calculateMonthlyPayment(50000, 20, 60, 4.5);
      // Expected: 40000 * (0.00375 * 1.00375^60) / (1.00375^60 - 1) ≈ 746.01
      expect(result.principal).toBeCloseTo(40000, 0);
      expect(result.monthlyPayment).toBeCloseTo(746.01, 0);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(50000);
    });

    it('computes correct payment for minimum term (12 months)', () => {
      const result = calculateMonthlyPayment(24000, 0, 12, 5);
      // Principal = 24000, r = 0.05/12, n = 12
      const r = 0.05 / 12;
      const n = 12;
      const expected = 24000 * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      expect(result.monthlyPayment).toBeCloseTo(expected, 2);
    });

    it('computes correct payment for maximum term (84 months)', () => {
      const result = calculateMonthlyPayment(100000, 10, 84, 6);
      expect(result.principal).toBeCloseTo(90000, 0);
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
    });
  });

  describe('0% interest edge case', () => {
    it('uses simple division when rate is 0', () => {
      const result = calculateMonthlyPayment(60000, 0, 60, 0);
      // 60000 / 60 = 1000
      expect(result.monthlyPayment).toBe(1000);
      expect(result.totalInterest).toBe(0);
      expect(result.totalCost).toBe(60000);
    });

    it('applies down payment before dividing at 0%', () => {
      const result = calculateMonthlyPayment(60000, 50, 60, 0);
      // Principal = 30000, 30000 / 60 = 500
      expect(result.monthlyPayment).toBe(500);
      expect(result.totalInterest).toBe(0);
    });
  });

  describe('100% down payment', () => {
    it('returns zero monthly payment when down is 100%', () => {
      const result = calculateMonthlyPayment(50000, 100, 60, 5);
      expect(result.principal).toBe(0);
      expect(result.monthlyPayment).toBe(0);
      expect(result.totalInterest).toBe(0);
      expect(result.totalCost).toBe(50000);
    });
  });

  describe('input clamping', () => {
    it('clamps down payment below 0 to 0', () => {
      const result = calculateMonthlyPayment(10000, -10, 60, 5);
      // Should behave as 0% down
      const expected = calculateMonthlyPayment(10000, 0, 60, 5);
      expect(result.monthlyPayment).toBe(expected.monthlyPayment);
    });

    it('clamps down payment above 100 to 100', () => {
      const result = calculateMonthlyPayment(10000, 150, 60, 5);
      // Should behave as 100% down
      expect(result.monthlyPayment).toBe(0);
      expect(result.principal).toBe(0);
    });

    it('clamps loan term below 12 to 12', () => {
      const result = calculateMonthlyPayment(10000, 0, 6, 5);
      const expected = calculateMonthlyPayment(10000, 0, 12, 5);
      expect(result.monthlyPayment).toBe(expected.monthlyPayment);
    });

    it('clamps loan term above 84 to 84', () => {
      const result = calculateMonthlyPayment(10000, 0, 120, 5);
      const expected = calculateMonthlyPayment(10000, 0, 84, 5);
      expect(result.monthlyPayment).toBe(expected.monthlyPayment);
    });

    it('clamps interest rate below 0 to 0', () => {
      const result = calculateMonthlyPayment(10000, 0, 60, -3);
      const expected = calculateMonthlyPayment(10000, 0, 60, 0);
      expect(result.monthlyPayment).toBe(expected.monthlyPayment);
    });

    it('clamps interest rate above 15 to 15', () => {
      const result = calculateMonthlyPayment(10000, 0, 60, 20);
      const expected = calculateMonthlyPayment(10000, 0, 60, 15);
      expect(result.monthlyPayment).toBe(expected.monthlyPayment);
    });
  });

  describe('result properties', () => {
    it('total cost equals down payment + total payments', () => {
      const result = calculateMonthlyPayment(80000, 25, 48, 3.5);
      const downPayment = 80000 * 0.25;
      const totalPayments = result.monthlyPayment * 48;
      expect(result.totalCost).toBeCloseTo(downPayment + totalPayments, 0);
    });

    it('total interest = total payments - principal', () => {
      const result = calculateMonthlyPayment(50000, 10, 72, 7);
      const totalPayments = result.monthlyPayment * 72;
      expect(result.totalInterest).toBeCloseTo(totalPayments - result.principal, 0);
    });

    it('monthly payment is positive for non-zero principal', () => {
      const result = calculateMonthlyPayment(30000, 50, 36, 4);
      expect(result.monthlyPayment).toBeGreaterThan(0);
    });
  });
});
