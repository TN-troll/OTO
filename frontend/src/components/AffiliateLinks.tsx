import { useLanguage } from '../i18n';

/**
 * Affiliate partner links — shown on listing detail pages.
 * These are first-party links, no cookie consent needed.
 */
export function AffiliateLinks({ price, make }: { price: number; make: string }) {
  const { locale } = useLanguage();
  const monthlyEstimate = Math.round(price / 60);

  return (
    <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-surface-500">
        {locale === 'nl' ? 'Partners' : 'Partners'}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {/* Financing */}
        <a
          href={`https://www.independer.nl/autolening/vergelijken?bedrag=${price}`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-brand-accent/30 hover:bg-brand-accent/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
            <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{locale === 'nl' ? 'Financiering' : 'Financing'}</p>
            <p className="text-[10px] text-surface-400">~&euro;{monthlyEstimate}/mnd</p>
          </div>
        </a>

        {/* Insurance */}
        <a
          href={`https://www.independer.nl/autoverzekering/vergelijken`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-brand-accent/30 hover:bg-brand-accent/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
            <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{locale === 'nl' ? 'Verzekering' : 'Insurance'}</p>
            <p className="text-[10px] text-surface-400">{locale === 'nl' ? 'Vergelijk' : 'Compare'}</p>
          </div>
        </a>

        {/* Inspection */}
        <a
          href={`https://www.anwb.nl/auto/aankoopkeuring`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-brand-accent/30 hover:bg-brand-accent/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
            <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{locale === 'nl' ? 'ANWB Keuring' : 'Inspection'}</p>
            <p className="text-[10px] text-surface-400">{locale === 'nl' ? 'Aankoopkeuring' : 'Pre-purchase'}</p>
          </div>
        </a>
      </div>
    </div>
  );
}
