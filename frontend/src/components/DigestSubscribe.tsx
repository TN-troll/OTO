import { useState } from 'react';
import { useLanguage } from '../i18n';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

export function DigestSubscribe() {
  const { locale } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/digest/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch { setStatus('error'); }
  };

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          ✓ {locale === 'nl' ? 'Ingeschreven! Je ontvangt wekelijks de beste deals.' : 'Subscribed! You\'ll get the best deals weekly.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
      <p className="text-sm font-semibold text-surface-900 dark:text-white">
        📬 {locale === 'nl' ? 'Wekelijkse Deal Digest' : 'Weekly Deal Digest'}
      </p>
      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
        {locale === 'nl' ? 'De beste nieuwe auto\'s elke week in je inbox' : 'The best new cars in your inbox every week'}
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={locale === 'nl' ? 'je@email.nl' : 'your@email.com'}
          className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder-surface-400 outline-none focus:border-brand-accent dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
        >
          {status === 'loading' ? '...' : locale === 'nl' ? 'Aanmelden' : 'Subscribe'}
        </button>
      </form>
      {status === 'error' && <p className="mt-2 text-xs text-red-500">Failed — try again</p>}
    </div>
  );
}
