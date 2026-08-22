import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hasAdConsent } from './CookieConsent';
import { api } from '../api/client';
import { useLanguage } from '../i18n';

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

interface AdSlotProps {
  /** Ad slot ID from AdSense (e.g., 'ca-pub-xxx/1234567890') */
  slot?: string;
  /** Ad format: 'horizontal' (728x90), 'rectangle' (300x250), 'in-feed' */
  format?: 'horizontal' | 'rectangle' | 'in-feed' | 'auto';
  /** Additional CSS class */
  className?: string;
}

/**
 * Google AdSense ad slot component.
 * Only renders if cookie consent has been given.
 * Falls back to a native dealer promotion if no consent.
 */
export function AdSlot({ slot, format = 'auto', className = '' }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const consent = hasAdConsent();

  useEffect(() => {
    if (!consent || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, [consent]);

  // No consent — show native/fallback ad
  if (!consent) {
    return (
      <NativeAdFallback format={format} className={className} />
    );
  }

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot || '0000000000'}
        data-ad-format={format === 'in-feed' ? 'fluid' : format === 'auto' ? 'auto' : ''}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Native ad fallback — shows a dealer/affiliate promotion when AdSense consent is declined.
 * These are first-party ads that don't require cookie consent.
 */
function NativeAdFallback({ format, className }: { format: string; className: string }) {
  return (
    <div className={`rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent/10">
          <svg className="h-5 w-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-white">OTO Premium</p>
          <p className="text-xs text-surface-400">
            Get featured placement & priority notifications
          </p>
        </div>
        <a href="/premium" className="ml-auto rounded-full bg-brand-accent/15 px-3 py-1.5 text-xs font-medium text-brand-accent transition-colors hover:bg-brand-accent/25">
          Learn more
        </a>
      </div>
    </div>
  );
}

/**
 * In-feed ad component — fetches from backend ad system first,
 * falls back to native promotion if no backend ads available.
 */
export function InFeedAd({ className = '', make }: { className?: string; make?: string }) {
  const { locale } = useLanguage();

  const { data } = useQuery({
    queryKey: ['ads', 'feed', make],
    queryFn: () => api.getAds('feed', make),
    staleTime: 60_000,
  });

  const ad = data?.ads?.[0];

  if (ad) {
    return (
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => api.trackAdClick(ad.id)}
        className={`block rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-5 transition-all hover:border-brand-accent/40 hover:bg-brand-accent/10 ${className}`}
      >
        <p className="text-[10px] font-medium uppercase tracking-wider text-surface-500">Gesponsord</p>
        <div className="mt-2 flex items-center gap-3">
          {ad.imageUrl && (
            <img src={ad.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
          )}
          <div>
            <p className="text-sm font-semibold text-white">{ad.title}</p>
            {ad.description && <p className="text-xs text-surface-400">{ad.description}</p>}
          </div>
        </div>
      </a>
    );
  }

  // Fallback — native self-promotion
  return (
    <div className={`rounded-2xl border border-brand-accent/20 bg-brand-accent/5 p-5 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-surface-500">Gesponsord</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-brand-accent/10 flex items-center justify-center">
          <svg className="h-6 w-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{locale === 'nl' ? 'Financiering nodig?' : 'Need financing?'}</p>
          <p className="text-xs text-surface-400">{locale === 'nl' ? 'Bereken uw maandlasten — vrijblijvend' : 'Calculate your monthly payments'}</p>
        </div>
      </div>
    </div>
  );
}
