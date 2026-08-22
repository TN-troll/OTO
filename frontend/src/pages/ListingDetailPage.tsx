import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { SoundProfile } from '@car-ads/shared';
import { useLanguage } from '../i18n';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { ListingCard } from '../components/ListingCard';
import { FinanceCalculator } from '../components/FinanceCalculator';
import { DealerContactForm } from '../components/DealerContactForm';
import { AffiliateLinks } from '../components/AffiliateLinks';
import { RdwCheck } from '../components/RdwCheck';
import { getProxyImageUrls } from '../utils/imageProxy';
import { useClickTracker } from '../hooks/useClickTracker';
import { resolveTranslation } from '../utils/translation';
import { sanitizeHtmlDescription, escapeHtml } from '../utils/sanitizer';
import { formatPrice, formatNumber, formatDecimal } from '../utils/formatNumber';
import { PageTransition } from '../components/PageTransition';
import { AnimateOnScroll } from '../components/AnimateOnScroll';
import { useCountUp } from '../hooks/useCountUp';

/** Extended listing type as returned by the detail API (includes nested soundProfile) */
interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  descriptionEn: string | null;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  location: string | null;
  sellerType: string | null;
  transmissionType: string | null;
  fuelType: string | null;
  imageUrls: string[];
  sourceUrls: { marketplace: string; url: string; externalId: string; lastChecked: string; isActive: boolean }[];
  soundProfile: SoundProfile | null;
  status: string;
  curationCriteria: string[];
  dateAdded: string;
  lastVerified: string;
  createdAt: string;
  updatedAt: string;
  marketAvgPrice: number | null;
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLanguage();
  const { addViewed } = useRecentlyViewed();
  const [showContactForm, setShowContactForm] = useState(false);

  const { data: listing, isLoading, error } = useQuery<ListingDetail>({
    queryKey: ['listing', id],
    queryFn: () => api.getListing(id!) as unknown as Promise<ListingDetail>,
    enabled: !!id,
  });

  // Track recently viewed
  useEffect(() => {
    if (id) {
      addViewed(id);
    }
  }, [id, addViewed]);

  // Update page title for SEO
  useEffect(() => {
    if (listing) {
      document.title = `${listing.make} ${listing.model} ${listing.year} — €${Math.round(listing.price).toLocaleString('nl-NL')} | OTO`;
    }
    return () => { document.title = 'OTO — Online Top Occasions'; };
  }, [listing]);

  // Fetch similar cars
  const { data: similarListings } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => api.getSimilarListings(id!),
    enabled: !!id,
  });

  // Fetch price history
  const { data: priceHistoryData } = useQuery({
    queryKey: ['priceHistory', id],
    queryFn: () => api.getPriceHistory(id!),
    enabled: !!id,
  });

  // Fetch AI price estimate
  const { data: priceEstimate } = useQuery({
    queryKey: ['priceEstimate', id],
    queryFn: async () => {
      const res = await fetch(`${(import.meta.env.VITE_API_URL || '')}/api/price-estimate/${id}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!id,
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
          <span className="text-sm text-surface-500 dark:text-surface-400">Loading listing details...</span>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="rounded-xl bg-white p-8 shadow-premium text-center dark:bg-surface-800">
          <p className="text-base font-semibold text-red-600 dark:text-red-400">Failed to load listing details.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline">
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="animate-fade-in scroll-smooth space-y-8 pb-20 md:pb-0">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-surface-600 transition-colors hover:text-brand-accent dark:text-surface-400 dark:hover:text-brand-accent">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t.backToListings}
      </Link>

      {/* Image Gallery */}
      <ImageGallery
        imageUrls={getProxyImageUrls(listing.imageUrls)}
        alt={`${listing.make} ${listing.model}`}
      />

      {/* Main Content */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-premium dark:bg-surface-800">
        <div className="p-6 sm:p-8">
          {/* Title and Price */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl dark:text-white">
                {listing.make} {listing.model}
              </h1>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                {listing.year} • {t.lastVerified} {formatDateTime(listing.lastVerified)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-xl bg-surface-50 px-5 py-3 dark:bg-surface-700">
                <p className="text-3xl font-bold text-brand dark:text-brand-accent">
                  {formatPrice(listing.price, locale)}
                </p>
              </div>
              <MarketValueBadge price={listing.price} marketAvgPrice={listing.marketAvgPrice} />
              {/* AI Price Estimate */}
              {priceEstimate?.estimate && (
                <div className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm ${
                  priceEstimate.verdict === 'below_market' ? 'bg-green-900/20 text-green-400' :
                  priceEstimate.verdict === 'above_market' ? 'bg-amber-900/20 text-amber-400' :
                  'bg-surface-50 text-surface-600 dark:bg-surface-800 dark:text-surface-300'
                }`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span className="font-medium">
                    {locale === 'nl' ? 'Geschatte waarde' : 'Estimated value'}: €{priceEstimate.estimate.toLocaleString('nl-NL')}
                  </span>
                  <span className="text-xs opacity-70">
                    ({locale === 'nl' ? `${priceEstimate.similarCount} vergelijkbaar` : `${priceEstimate.similarCount} similar`})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick facts bar */}
          <div className="mt-4 flex flex-wrap gap-3 rounded-xl bg-surface-50 px-4 py-3 dark:bg-surface-800">
            {listing.mileage != null && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-surface-400">{locale === 'nl' ? 'Km-stand' : 'Mileage'}:</span>
                <span className="font-semibold text-surface-900 dark:text-white">{formatNumber(listing.mileage, locale)} km</span>
              </div>
            )}
            {listing.horsepower != null && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-surface-400">{locale === 'nl' ? 'Vermogen' : 'Power'}:</span>
                <span className="font-semibold text-surface-900 dark:text-white">{listing.horsepower} pk</span>
              </div>
            )}
            {listing.transmissionType && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-surface-400">{locale === 'nl' ? 'Transmissie' : 'Transmission'}:</span>
                <span className="font-semibold text-surface-900 dark:text-white capitalize">{listing.transmissionType}</span>
              </div>
            )}
            {listing.fuelType && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-surface-400">{locale === 'nl' ? 'Brandstof' : 'Fuel'}:</span>
                <span className="font-semibold text-surface-900 dark:text-white capitalize">{listing.fuelType}</span>
              </div>
            )}
            {listing.location && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-surface-400">{locale === 'nl' ? 'Locatie' : 'Location'}:</span>
                <span className="font-semibold text-surface-900 dark:text-white">{listing.location}</span>
              </div>
            )}
          </div>

          {/* Share Buttons */}
          <ShareButtons listing={listing} />

          {/* More from this seller */}
          {listing.location && listing.sellerType && (
            <Link
              to={`/seller?location=${encodeURIComponent(listing.location)}&type=${listing.sellerType}`}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-surface-300 transition-all duration-200 hover:border-brand-accent/30 hover:bg-brand-accent/10 hover:text-brand-accent"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
              {locale === 'nl'
                ? `Meer van deze ${listing.sellerType === 'dealer' ? 'dealer' : 'verkoper'} in ${listing.location}`
                : `More from this ${listing.sellerType === 'dealer' ? 'dealer' : 'seller'} in ${listing.location}`
              }
            </Link>
          )}

          {/* Request Info Button + Compare Button */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setShowContactForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand/90 hover:shadow-md"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Request Info
            </button>
            <Link
              to={`/compare?ids=${listing.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-accent/40 bg-brand-accent/10 px-5 py-2.5 text-sm font-medium text-brand-accent shadow-sm transition-all hover:bg-brand-accent/20 hover:shadow-md dark:border-brand-accent/30 dark:bg-brand-accent/5"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              {locale === 'nl' ? 'Vergelijk' : 'Compare'}
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(locale === 'nl' ? `Ik wil een melding als deze ${listing.make} ${listing.model} in prijs daalt: ${window.location.href}` : `Notify me if this ${listing.make} ${listing.model} drops in price: ${window.location.href}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-5 py-2.5 text-sm font-medium text-green-600 shadow-sm transition-all hover:bg-green-500/20 dark:border-green-500/30 dark:text-green-400"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              {locale === 'nl' ? 'Prijsalert' : 'Price alert'}
            </a>
          </div>

          {/* Quick Jump Navigation */}
          <nav className="mt-6 flex flex-wrap gap-2 border-t border-surface-200 pt-4 dark:border-surface-700" aria-label="Jump to section">
            <a href="#specifications" className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors duration-150 hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:text-brand-accent dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-brand-accent/30 dark:hover:text-brand-accent">
              {t.specifications}
            </a>
            {listing.description && (
              <a href="#description" className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors duration-150 hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:text-brand-accent dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-brand-accent/30 dark:hover:text-brand-accent">
                {locale === 'nl' ? 'Beschrijving' : 'Description'}
              </a>
            )}
            <a href="#price-history" className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors duration-150 hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:text-brand-accent dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-brand-accent/30 dark:hover:text-brand-accent">
              {locale === 'nl' ? 'Prijshistorie' : 'Price History'}
            </a>
            <a href="#depreciation" className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors duration-150 hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:text-brand-accent dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-brand-accent/30 dark:hover:text-brand-accent">
              {locale === 'nl' ? 'Afschrijving' : 'Depreciation'}
            </a>
            <a href="#finance" className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors duration-150 hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:text-brand-accent dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-brand-accent/30 dark:hover:text-brand-accent">
              {locale === 'nl' ? 'Financiering' : 'Finance'}
            </a>
            {listing.soundProfile && (
              <a href="#sound" className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors duration-150 hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:text-brand-accent dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-brand-accent/30 dark:hover:text-brand-accent">
                {locale === 'nl' ? 'Geluid' : 'Sound'}
              </a>
            )}
            <a href="#source-links" className="inline-flex items-center gap-1 rounded-full border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors duration-150 hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:text-brand-accent dark:border-surface-600 dark:bg-surface-800 dark:text-surface-400 dark:hover:border-brand-accent/30 dark:hover:text-brand-accent">
              {t.originalAdvertisements}
            </a>
          </nav>

          {/* Dealer Contact Form Modal */}
          {showContactForm && (
            <DealerContactForm
              listingId={listing.id}
              listingTitle={`${listing.make} ${listing.model}`}
              listingPrice={listing.price}
              sourceUrl={listing.sourceUrls?.[0]?.url || ''}
              onClose={() => setShowContactForm(false)}
            />
          )}

          {/* Specifications Grid */}
          <AnimateOnScroll animation="fade-in-up">
          <div id="specifications" className="scroll-mt-4">
            <SpecificationsSection listing={listing} />
          </div>
          </AnimateOnScroll>

          {/* Description */}
          {listing.description && (
            <AnimateOnScroll animation="fade-in-up">
            <div id="description" className="scroll-mt-4">
              <DescriptionSection
                description={listing.description}
                descriptionEn={listing.descriptionEn}
              />
            </div>
            </AnimateOnScroll>
          )}

          {/* Price History */}
          <AnimateOnScroll animation="fade-in-up">
          <div id="price-history" className="scroll-mt-4">
            <PriceHistorySection history={priceHistoryData?.history} />
          </div>
          </AnimateOnScroll>

          {/* Depreciation Calculator */}
          <div id="depreciation" className="scroll-mt-4">
            <DepreciationSection price={listing.price} year={listing.year} mileage={listing.mileage} make={listing.make} />
          </div>

          {/* Finance Calculator */}
          <div id="finance" className="scroll-mt-4">
            <FinanceCalculator listingPrice={listing.price} />
          </div>

          {/* Sound Profile Section — only when sound data available */}
          {listing.soundProfile && (
            <div id="sound" className="scroll-mt-4">
              <SoundProfileSection soundProfile={listing.soundProfile} />
            </div>
          )}

          {/* YouTube Engine Sound */}
          <YouTubeSoundSection make={listing.make} model={listing.model} />

          {/* Source Links */}
          <div id="source-links" className="scroll-mt-4">
            <SourceLinksSection sourceUrls={listing.sourceUrls} listingId={listing.id} />
          </div>

          {/* RDW License Plate Check */}
          <RdwCheck make={listing.make} model={listing.model} year={listing.year} />

          {/* Report as sold */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                if (confirm(locale === 'nl' ? 'Weet je zeker dat deze auto verkocht is?' : 'Are you sure this car is sold?')) {
                  fetch(`${(import.meta.env.VITE_API_URL || '')}/api/listings/${listing.id}/report-sold`, { method: 'POST' }).catch(() => {});
                  alert(locale === 'nl' ? 'Bedankt voor het melden!' : 'Thanks for reporting!');
                }
              }}
              className="text-xs text-surface-400 underline hover:text-surface-600 dark:hover:text-surface-300"
            >
              {locale === 'nl' ? 'Meldt als verkocht' : 'Report as sold'}
            </button>
          </div>

          {/* Affiliate Partner Links */}
          <AffiliateLinks price={listing.price} make={listing.make} model={listing.model} year={listing.year} mileage={listing.mileage} />
        </div>
      </div>

      {/* Similar Cars Section */}
      {similarListings && similarListings.length > 0 && (
        <AnimateOnScroll animation="fade-in-up">
        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-surface-900 dark:text-white">
              {locale === 'nl' ? 'Vergelijkbare auto\'s' : 'Similar Cars'}
            </h2>
            <span className="text-xs text-surface-400">
              {locale === 'nl' ? 'Op basis van merk, prijs & vermogen' : 'Based on make, price & power'}
            </span>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {similarListings.map((similar) => {
              // Determine similarity reasons
              const reasons: string[] = [];
              if (similar.make === listing.make) reasons.push(locale === 'nl' ? 'Zelfde merk' : 'Same make');
              if (similar.horsepower && listing.horsepower && Math.abs(similar.horsepower - listing.horsepower) < 50) {
                reasons.push(locale === 'nl' ? '≈ Vermogen' : '≈ Power');
              }
              if (Math.abs(similar.price - listing.price) / listing.price < 0.2) {
                reasons.push(locale === 'nl' ? '≈ Prijs' : '≈ Price');
              }

              return (
                <div key={similar.id} className="w-72 flex-shrink-0">
                  {reasons.length > 0 && (
                    <div className="mb-1.5 flex gap-1.5">
                      {reasons.map((reason, i) => (
                        <span key={i} className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[10px] font-medium text-brand-accent">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                  <ListingCard listing={similar} featured={false} />
                </div>
              );
            })}
          </div>
        </div>
        </AnimateOnScroll>
      )}

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-white/[0.08] bg-surface-900/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div>
          <p className="text-lg font-bold text-white">{formatPrice(listing.price, locale)}</p>
          <p className="text-xs text-surface-400">{listing.make} {listing.model}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${listing.make} ${listing.model} - ${formatPrice(listing.price, locale)}: ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-sm transition-transform active:scale-95"
            aria-label="Share via WhatsApp"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
          <button
            onClick={() => setShowContactForm(true)}
            className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            Contact
          </button>
        </div>
      </div>
    </div>
    </PageTransition>
  );
}

/** Description section with language-aware display */
export function DescriptionSection({ description, descriptionEn }: { description: string; descriptionEn: string | null }) {
  const { t, locale } = useLanguage();

  const { text, badge } = resolveTranslation(description, descriptionEn, locale);

  // Sanitize HTML content; if sanitization fails or produces only whitespace,
  // fall back to showing the original Dutch description as escaped plain text.
  let sanitizedHtml: string;
  const sanitized = sanitizeHtmlDescription(text);
  if (!sanitized || sanitized.trim() === '') {
    // Fallback: show original Dutch as escaped plain text
    sanitizedHtml = escapeHtml(description);
  } else {
    sanitizedHtml = sanitized;
  }

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-surface-900 dark:text-white">
          {t.adDescription}
        </h2>
        {badge === 'translated' && (
          <span
            aria-label="This description has been translated from Dutch to English"
            className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-[10px] font-medium text-gold-dark dark:text-gold-light"
          >
            🌐 Translated
          </span>
        )}
        {badge === 'original-nl' && (
          <span
            aria-label="This description is shown in the original Dutch language"
            className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-medium text-surface-500 dark:bg-surface-700 dark:text-surface-400"
          >
            🇳🇱 Original (NL)
          </span>
        )}
      </div>
      <div
        className="mt-4 text-sm leading-relaxed text-surface-600 dark:text-surface-300"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}

/** Image gallery with main image and thumbnail navigation */
function ImageGallery({ imageUrls, alt }: { imageUrls: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageTimedOut, setImageTimedOut] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset states when active image changes
  useEffect(() => {
    setImageLoaded(false);
    setImageTimedOut(false);
    setImageError(false);

    // Start 10-second timeout for loading
    timeoutRef.current = setTimeout(() => {
      setImageTimedOut(true);
    }, 10000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeIndex]);

  // Clear timeout when image loads or errors
  useEffect(() => {
    if (imageLoaded || imageError) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [imageLoaded, imageError]);

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div
        className="flex aspect-video items-center justify-center rounded-2xl bg-surface-100 text-surface-400 dark:bg-surface-700 dark:text-surface-500"
        role="img"
        aria-label="No images available"
      >
        No images available
      </div>
    );
  }

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex < imageUrls.length - 1;

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface-100 shadow-premium dark:bg-surface-700">
        {!imageError && !imageTimedOut ? (
          <>
            {/* Shimmer while loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-surface-100 via-surface-200 to-surface-100 bg-[length:200%_100%] dark:from-surface-800 dark:via-surface-700 dark:to-surface-800" />
            )}
            <img
              src={imageUrls[activeIndex]}
              alt={`${alt} - image ${activeIndex + 1}`}
              className={`mx-auto h-full w-full cursor-zoom-in object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="eager"
              fetchPriority="high"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              onClick={() => setLightboxOpen(true)}
            />
          </>
        ) : imageTimedOut && !imageError ? (
          <div
            className="flex h-full w-full animate-pulse items-center justify-center"
            role="img"
            aria-label="Image is loading"
          >
            <svg className="h-16 w-16 text-surface-300 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0V6.375c0-.621-.504-1.125-1.125-1.125H4.125C3.504 5.25 3 5.754 3 6.375v8.084M12 9.75H9.75" />
            </svg>
          </div>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            role="img"
            aria-label="Image could not be loaded"
          >
            <svg className="h-16 w-16 text-surface-300 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0V6.375c0-.621-.504-1.125-1.125-1.125H4.125C3.504 5.25 3 5.754 3 6.375v8.084M12 9.75H9.75" />
            </svg>
          </div>
        )}

        {/* Left Arrow */}
        {canGoLeft && (
          <button
            onClick={() => { setActiveIndex((i) => i - 1); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg transition-all hover:bg-white hover:scale-105 dark:bg-surface-800/90 dark:hover:bg-surface-800"
            aria-label="Previous image"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* Right Arrow */}
        {canGoRight && (
          <button
            onClick={() => { setActiveIndex((i) => i + 1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg transition-all hover:bg-white hover:scale-105 dark:bg-surface-800/90 dark:hover:bg-surface-800"
            aria-label="Next image"
          >
            <ChevronRightIcon />
          </button>
        )}

        {/* Image counter */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-brand/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {activeIndex + 1} / {imageUrls.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => { setActiveIndex(index); }}
              className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                index === activeIndex
                  ? 'ring-2 ring-brand-accent ring-offset-2 dark:ring-offset-surface-900'
                  : 'opacity-60 hover:opacity-100'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={url}
                alt={`${alt} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <LightboxOverlay
          imageUrls={imageUrls}
          activeIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))}
          onNext={() => setActiveIndex((i) => Math.min(imageUrls.length - 1, i + 1))}
        />
      )}
    </div>
  );
}

/** All specifications displayed in a structured grid */
function SpecificationsSection({ listing }: { listing: ListingDetail }) {
  const { t, locale } = useLanguage();

  const specs = [
    { label: t.horsepower, value: listing.horsepower ? `${listing.horsepower} HP` : null },
    { label: t.engineDisplacement, value: listing.engineDisplacementCc ? `${listing.engineDisplacementCc} cc` : null },
    { label: t.mileage, value: listing.mileage != null ? `${formatNumber(listing.mileage, locale)} km` : null },
    { label: t.transmission, value: listing.transmissionType ? capitalize(listing.transmissionType) : null },
    { label: t.fuelType, value: listing.fuelType ? capitalize(listing.fuelType) : null },
    { label: t.location, value: listing.location },
    { label: t.sellerType, value: listing.sellerType ? (listing.sellerType === 'dealer' ? t.dealer : t.private) : null },
    { label: t.year, value: listing.year ? String(listing.year) : null },
    { label: t.dateAdded, value: listing.dateAdded ? formatDate(listing.dateAdded) : null },
  ];

  const displayedSpecs = specs.filter((s) => s.value != null);

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">{t.specifications}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {displayedSpecs.map((spec) => (
          <div key={spec.label} className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
            <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{spec.label}</dt>
            <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Sound profile section with audio player */
function SoundProfileSection({ soundProfile }: { soundProfile: SoundProfile | null }) {
  const { t } = useLanguage();

  if (!soundProfile) return null;

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">{t.soundProfile}</h2>

      <div className="mt-4 space-y-5">
        {/* Characteristics */}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
            <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.engineConfiguration}</dt>
            <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.engineConfiguration)}</dd>
          </div>
          <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
            <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.cylinders}</dt>
            <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{soundProfile.cylinderCount}</dd>
          </div>
          <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
            <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.induction}</dt>
            <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.forcedInduction)}</dd>
          </div>
          <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
            <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.exhaustNote}</dt>
            <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.exhaustNote)}</dd>
          </div>
        </dl>

        {/* Audio Player */}
        <AudioPlayer soundProfileId={soundProfile.id} />
      </div>
    </div>
  );
}

/** HTML5 audio player with error handling */
function AudioPlayer({ soundProfileId }: { soundProfileId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState(false);
  const { t } = useLanguage();
  const audioUrl = api.getAudioClipUrl(soundProfileId);

  if (audioError) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-700">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          {t.audioUnavailable}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.engineSoundClip}</p>
      <audio
        ref={audioRef}
        controls
        className="w-full"
        onError={() => setAudioError(true)}
        aria-label="Engine sound clip"
      >
        <source src={audioUrl} type="audio/mpeg" />
        <source src={audioUrl} type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

/** Source marketplace links — routed through click tracker */
function SourceLinksSection({
  sourceUrls,
  listingId,
}: {
  sourceUrls: ListingDetail['sourceUrls'];
  listingId: string;
}) {
  const { t } = useLanguage();
  const { trackOutboundClick, isTracking } = useClickTracker(listingId);

  if (!sourceUrls || sourceUrls.length === 0) return null;

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">{t.originalAdvertisements}</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {sourceUrls.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => trackOutboundClick(e, source.url)}
            className={`inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-all duration-200 hover:border-brand-accent hover:text-brand-accent hover:shadow-md dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-accent dark:hover:text-brand-accent ${isTracking ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {isTracking ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-surface-300 border-t-brand-accent" />
            ) : (
              <ExternalLinkIcon />
            )}
            {t.viewOn} {capitalize(source.marketplace)}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Lightbox Overlay ─── */

function LightboxOverlay({
  imageUrls,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}: {
  imageUrls: string[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const touchStart = useRef<number>(0);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (delta > 50) onPrev();
    else if (delta < -50) onNext();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Previous button */}
      {activeIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          aria-label="Previous image"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <img
        src={imageUrls[activeIndex]}
        alt={`Image ${activeIndex + 1} of ${imageUrls.length}`}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {activeIndex < imageUrls.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          aria-label="Next image"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Counter */}
      <div className="absolute bottom-4 text-sm text-white/80">
        {activeIndex + 1} / {imageUrls.length}
      </div>
    </div>
  );
}

/* ─── Price History Section ─── */

function PriceHistorySection({ history }: { history?: { price: number; date: string }[] }) {
  const { locale } = useLanguage();

  if (!history || history.length < 2) return null;

  // Build sparkline SVG path
  const prices = history.map(h => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;
  const width = 280;
  const height = 60;
  const padding = 4;

  const points = prices.map((price, i) => {
    const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (price - minPrice) / range) * (height - padding * 2);
    return `${x},${y}`;
  });
  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const totalDiff = lastPrice - firstPrice;
  const isDown = totalDiff < 0;

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">
          {locale === 'nl' ? 'Prijshistorie' : 'Price History'}
        </h2>
        {totalDiff !== 0 && (
          <span className={`text-sm font-semibold ${isDown ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
            {isDown ? '↓' : '↑'} €{formatNumber(Math.abs(Math.round(totalDiff)), locale)}
          </span>
        )}
      </div>

      {/* Sparkline chart */}
      <div className="mt-4 rounded-xl bg-surface-50 p-4 dark:bg-surface-700/50">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
          {/* Area fill */}
          <path
            d={areaPath}
            fill={isDown ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
          />
          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={isDown ? '#22c55e' : '#ef4444'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dots */}
          {points.map((point, i) => {
            const [x, y] = point.split(',').map(Number);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={isDown ? '#22c55e' : '#ef4444'}
                opacity={i === prices.length - 1 ? 1 : 0.5}
              />
            );
          })}
        </svg>
        <div className="mt-2 flex justify-between text-[10px] text-surface-400">
          <span>{new Date(history[0].date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}</span>
          <span>{new Date(history[history.length - 1].date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}</span>
        </div>
      </div>

      {/* Price entries list */}
      <div className="mt-4 space-y-2">
        {history.map((entry, index) => {
          const prevPrice = index > 0 ? history[index - 1].price : null;
          const diff = prevPrice !== null ? entry.price - prevPrice : null;
          return (
            <div key={index} className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-2.5 dark:bg-surface-700">
              <span className="text-sm text-surface-600 dark:text-surface-300">
                {new Date(entry.date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-surface-900 dark:text-white">
                  {formatPrice(entry.price, locale)}
                </span>
                {diff !== null && diff !== 0 && (
                  <span className={`text-xs font-medium ${diff < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {diff < 0 ? '▼' : '▲'} €{formatNumber(Math.abs(Math.round(diff)), locale)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Market Value Badge ─── */

function MarketValueBadge({ price, marketAvgPrice }: { price: number; marketAvgPrice: number | null }) {
  if (!marketAvgPrice) return null;

  const ratio = price / marketAvgPrice;

  let label: string;
  let className: string;
  if (ratio < 0.85) {
    label = 'Below Market';
    className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  } else if (ratio > 1.15) {
    label = 'Above Market';
    className = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  } else {
    label = 'Fair Price';
    className = 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

/* ─── YouTube Engine Sound Section ─── */

function YouTubeSoundSection({ make, model }: { make: string; model: string }) {
  const searchQuery = encodeURIComponent(`${make} ${model} engine sound exhaust`);
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">Engine Sound</h2>
      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">Listen to how this {make} {model} sounds</p>
      <a
        href={youtubeSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 group flex items-center gap-4 rounded-xl bg-surface-50 p-4 transition-all hover:bg-surface-100 hover:shadow-md dark:bg-surface-700 dark:hover:bg-surface-600"
      >
        {/* YouTube play icon */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
          <svg className="h-6 w-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-surface-900 group-hover:text-brand-accent dark:text-white">
            {make} {model} Engine Sound
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Watch on YouTube →
          </p>
        </div>
      </a>
    </div>
  );
}

/* ─── Depreciation Section ─── */

function DepreciationSection({ price, year, mileage, make }: { price: number; year: number; mileage: number | null; make: string }) {
  const { locale } = useLanguage();
  const luxuryBrands = ['Ferrari', 'Lamborghini', 'McLaren', 'Bugatti', 'Pagani', 'Koenigsegg', 'Rolls-Royce'];
  const isLuxury = luxuryBrands.includes(make);
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const annualRate = isLuxury ? 0.06 : 0.10;
  
  const projections = [1, 2, 3, 5].map(yearsAhead => {
    const appreciating = isLuxury && age > 15;
    const projectedPrice = appreciating 
      ? Math.round(price * Math.pow(1.03, yearsAhead)) 
      : Math.round(price * Math.pow(1 - annualRate, yearsAhead));
    return { years: yearsAhead, price: projectedPrice };
  });

  const monthlyDepreciation = Math.round((price * annualRate) / 12);

  const isNl = locale === 'nl';
  const title = isNl ? 'Waardeverloop' : 'Depreciation Estimate';
  const subtitle = isNl
    ? `Gebaseerd op ${isLuxury ? 'luxe/exotisch' : 'performance'} afschrijvingspatronen (${age} jaar oud)`
    : `Based on ${isLuxury ? 'luxury/exotic' : 'performance'} car depreciation patterns (${age} years old)`;
  const inYears = (n: number) => isNl ? `Over ${n} ${n === 1 ? 'jaar' : 'jaar'}` : `In ${n} ${n === 1 ? 'year' : 'years'}`;
  const monthlyLabel = isNl
    ? 'Geschatte maandelijkse kosten (alleen afschrijving):'
    : 'Estimated monthly cost of ownership (depreciation only):';
  const disclaimer = isNl
    ? '* Vereenvoudigde schatting op basis van historische afschrijvingspercentages. Werkelijke waarden kunnen aanzienlijk afwijken.'
    : '* Simplified estimate based on historical depreciation rates. Actual values may differ significantly based on condition, mileage, and market demand.';

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">{title}</h2>
      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">{subtitle}</p>
      
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {projections.map(p => (
          <div key={p.years} className="rounded-lg bg-surface-50 p-3 text-center dark:bg-surface-700">
            <p className="text-[10px] font-medium text-surface-500 dark:text-surface-400">{inYears(p.years)}</p>
            <p className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatPrice(p.price, locale)}</p>
            <p className={`text-[10px] ${p.price < price ? 'text-red-500' : 'text-green-500'}`}>
              {p.price < price ? '▼' : '▲'} €{formatNumber(Math.abs(p.price - price), locale)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-50 px-4 py-2.5 dark:bg-surface-700">
        <span className="text-xs text-surface-500 dark:text-surface-400">{monthlyLabel}</span>
        <span className="text-sm font-bold text-surface-900 dark:text-white">€{formatDecimal(monthlyDepreciation, locale, 2)}/{isNl ? 'mnd' : 'mo'}</span>
      </div>

      <p className="mt-2 text-[10px] text-surface-400 dark:text-surface-500 italic">{disclaimer}</p>
    </div>
  );
}

/* ─── Utility functions ─── */

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/* ─── Share Buttons ─── */

function ShareButtons({ listing }: { listing: ListingDetail }) {
  const [copied, setCopied] = useState(false);

  const url = window.location.href;
  const title = `${listing.make} ${listing.model}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this ${title}: ${url}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`${title} on OTO`)}&body=${encodeURIComponent(`Check out this ${title}: ${url}`)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="text-xs font-medium text-surface-500 dark:text-surface-400">Share:</span>
      <button
        type="button"
        onClick={copyToClipboard}
        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-all hover:border-brand-accent hover:text-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-accent dark:hover:text-brand-accent"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-5.03a4.5 4.5 0 00-6.364-6.364L4.5 8.88a4.5 4.5 0 001.242 7.244" />
        </svg>
        {copied ? 'Link copied!' : 'Copy link'}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-all hover:border-green-500 hover:text-green-600 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-green-500 dark:hover:text-green-400"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </a>
      <a
        href={emailUrl}
        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-all hover:border-brand-accent hover:text-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-accent dark:hover:text-brand-accent"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        Email
      </a>
    </div>
  );
}

/* ─── Icons ─── */

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-surface-700 dark:text-surface-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-surface-700 dark:text-surface-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}
