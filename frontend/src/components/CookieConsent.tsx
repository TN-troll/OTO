import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';

const CONSENT_KEY = 'oto-cookie-consent';

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

function getConsent(): ConsentStatus {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'rejected') return stored;
  } catch {}
  return 'pending';
}

/**
 * Load Google AdSense script after consent is given.
 */
function loadAdSense() {
  if (document.querySelector('script[src*="adsbygoogle"]')) return;
  const script = document.createElement('script');
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
  script.async = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentStatus>(getConsent);
  const { locale } = useLanguage();

  useEffect(() => {
    if (consent === 'accepted') {
      loadAdSense();
    }
  }, [consent]);

  if (consent !== 'pending') return null;

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setConsent('rejected');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] animate-fade-in p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="rounded-2xl border border-white/[0.1] bg-surface-900/95 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 flex-shrink-0 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-white">
              {locale === 'nl' ? 'Cookies & advertenties' : 'Cookies & ads'}
            </p>
            <p className="mt-1 text-xs text-surface-400">
              {locale === 'nl'
                ? 'We gebruiken cookies voor gepersonaliseerde advertenties. Je kunt dit weigeren zonder functionaliteitsverlies.'
                : 'We use cookies for personalized ads. You can decline without losing functionality.'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 rounded-xl bg-brand-accent px-4 py-2 text-sm font-bold text-white transition-transform active:scale-95"
          >
            {locale === 'nl' ? 'Accepteren' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-white/[0.08]"
          >
            {locale === 'nl' ? 'Weigeren' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Check if ad consent has been given */
export function hasAdConsent(): boolean {
  return getConsent() === 'accepted';
}
