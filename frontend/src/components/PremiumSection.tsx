import { useState } from 'react';
import { PremiumSignupModal } from './PremiumSignupModal';
import { PremiumBadge } from './PremiumBadge';

export interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'price_alerts',
    title: 'Price Drop Alerts',
    description: "Get notified when a car you're watching drops in price",
    icon: 'bell',
  },
  {
    id: 'saved_searches',
    title: 'Saved Search Notifications',
    description: 'Automatic alerts for new listings matching your criteria',
    icon: 'search',
  },
  {
    id: 'early_access',
    title: 'Early Access',
    description: '24-hour head start on new listings before they appear publicly',
    icon: 'clock',
  },
];

function FeatureIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'bell':
      return (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      );
    case 'search':
      return (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      );
    case 'clock':
      return (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export function PremiumSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 dark:border-amber-800/50 dark:from-surface-800 dark:to-surface-800">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">
          Premium Features
        </h2>
        <PremiumBadge />
      </div>

      <p className="mb-6 text-sm text-surface-600 dark:text-surface-300">
        Unlock exclusive features designed for serious car enthusiasts. Be the first to know when we launch.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {PREMIUM_FEATURES.map((feature) => (
          <div
            key={feature.id}
            className="rounded-xl border border-amber-100 bg-white/70 p-4 transition-all hover:shadow-md dark:border-surface-600 dark:bg-surface-700/50"
          >
            <div className="mb-3 text-amber-600 dark:text-amber-400">
              <FeatureIcon icon={feature.icon} />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-surface-900 dark:text-white">
              {feature.title}
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {feature.description}
            </p>
            <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Coming Soon
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-surface-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Get Notified When Available
        </button>
      </div>

      <PremiumSignupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
