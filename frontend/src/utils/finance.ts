/**
 * Finance calculator utility functions.
 * Pure functions for computing monthly car loan payments using the standard amortization formula.
 */

export interface FinanceCalculation {
  principal: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
}

/**
 * Clamps a value to a [min, max] range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates monthly payment using the standard amortization formula:
 *   M = P[r(1+r)^n] / [(1+r)^n - 1]
 *
 * Where:
 *   P = principal (price - down payment)
 *   r = monthly interest rate (annual / 12 / 100)
 *   n = number of monthly payments
 *
 * Edge cases:
 *   - 0% interest: M = P / n
 *   - 100% down payment: returns zeroed calculation (no financing needed)
 */
export function calculateMonthlyPayment(
  price: number,
  downPaymentPercent: number,
  loanTermMonths: number,
  annualInterestRate: number
): FinanceCalculation {
  // Clamp inputs to valid ranges
  const clampedDown = clamp(downPaymentPercent, 0, 100);
  const clampedTerm = clamp(loanTermMonths, 12, 84);
  const clampedRate = clamp(annualInterestRate, 0, 15);

  const principal = price * (1 - clampedDown / 100);

  // No financing needed
  if (clampedDown === 100 || principal <= 0) {
    return {
      principal: 0,
      monthlyPayment: 0,
      totalInterest: 0,
      totalCost: price,
    };
  }

  let monthlyPayment: number;

  if (clampedRate === 0) {
    // 0% interest edge case: simple division
    monthlyPayment = principal / clampedTerm;
  } else {
    // Standard amortization formula
    const r = clampedRate / 12 / 100; // monthly rate
    const n = clampedTerm;
    const compoundFactor = Math.pow(1 + r, n);
    monthlyPayment = principal * (r * compoundFactor) / (compoundFactor - 1);
  }

  // Guard against NaN/Infinity
  if (!isFinite(monthlyPayment) || isNaN(monthlyPayment)) {
    return {
      principal,
      monthlyPayment: 0,
      totalInterest: 0,
      totalCost: price,
    };
  }

  const totalPaid = monthlyPayment * clampedTerm;
  const totalInterest = totalPaid - principal;

  return {
    principal: Math.round(principal * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round((price - principal + totalPaid) * 100) / 100,
  };
}
