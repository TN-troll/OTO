import { PremiumSection } from '../components/PremiumSection';

export function PremiumPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
          OTO Premium
        </h1>
        <p className="mt-2 text-surface-500 dark:text-surface-400">
          Exclusive features for the discerning car enthusiast
        </p>
      </div>

      <PremiumSection />
    </div>
  );
}
