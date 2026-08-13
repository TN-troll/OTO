import { useState, useMemo } from 'react';
import { calculateMonthlyPayment, clamp } from '../utils/finance';

interface FinanceCalculatorProps {
  listingPrice: number; // EUR
}

/**
 * Finance Calculator component.
 * Displays estimated monthly payments using the standard amortization formula.
 * Placed below the price section on listing detail pages.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export function FinanceCalculator({ listingPrice }: FinanceCalculatorProps) {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTermMonths, setLoanTermMonths] = useState(60);
  const [annualInterestRate, setAnnualInterestRate] = useState(4.5);

  // Recalculate immediately on any input change (synchronous — no debounce needed)
  const calculation = useMemo(
    () => calculateMonthlyPayment(listingPrice, downPaymentPercent, loanTermMonths, annualInterestRate),
    [listingPrice, downPaymentPercent, loanTermMonths, annualInterestRate]
  );

  const noFinancingNeeded = downPaymentPercent === 100;

  function handleDownPaymentChange(value: string) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    setDownPaymentPercent(clamp(parsed, 0, 100));
  }

  function handleLoanTermChange(value: string) {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;
    setLoanTermMonths(clamp(parsed, 12, 84));
  }

  function handleInterestRateChange(value: string) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    setAnnualInterestRate(clamp(parsed, 0, 15));
  }

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">
        Finance Calculator
      </h2>
      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
        Estimate your monthly payments
      </p>

      {/* Inputs */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Down Payment */}
        <div>
          <label
            htmlFor="fc-down-payment"
            className="block text-xs font-medium text-surface-600 dark:text-surface-400"
          >
            Down Payment (%)
          </label>
          <input
            id="fc-down-payment"
            type="number"
            min={0}
            max={100}
            step={1}
            value={downPaymentPercent}
            onChange={(e) => handleDownPaymentChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-white"
          />
        </div>

        {/* Loan Term */}
        <div>
          <label
            htmlFor="fc-loan-term"
            className="block text-xs font-medium text-surface-600 dark:text-surface-400"
          >
            Loan Term (months)
          </label>
          <input
            id="fc-loan-term"
            type="number"
            min={12}
            max={84}
            step={1}
            value={loanTermMonths}
            onChange={(e) => handleLoanTermChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-white"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <label
            htmlFor="fc-interest-rate"
            className="block text-xs font-medium text-surface-600 dark:text-surface-400"
          >
            Interest Rate (%)
          </label>
          <input
            id="fc-interest-rate"
            type="number"
            min={0}
            max={15}
            step={0.1}
            value={annualInterestRate}
            onChange={(e) => handleInterestRateChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-white"
          />
        </div>
      </div>

      {/* Results */}
      <div className="mt-4">
        {noFinancingNeeded ? (
          <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              No financing needed
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              With 100% down payment, no loan is required.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-700">
              <p className="text-[10px] font-medium text-surface-500 dark:text-surface-400">
                Monthly Payment
              </p>
              <p className="mt-1 text-lg font-bold text-brand dark:text-brand-accent">
                €{calculation.monthlyPayment.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-700">
              <p className="text-[10px] font-medium text-surface-500 dark:text-surface-400">
                Total Interest
              </p>
              <p className="mt-1 text-sm font-bold text-surface-900 dark:text-white">
                €{calculation.totalInterest.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-700">
              <p className="text-[10px] font-medium text-surface-500 dark:text-surface-400">
                Total Cost
              </p>
              <p className="mt-1 text-sm font-bold text-surface-900 dark:text-white">
                €{calculation.totalCost.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <p className="mt-3 text-[10px] text-surface-400 dark:text-surface-500">
        This calculation is an estimate only and does not constitute a financing offer.
      </p>
    </div>
  );
}
