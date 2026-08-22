import { useEffect } from 'react';
import { useLanguage } from '../i18n';

interface Collection {
  id: string;
  title: string;
  titleNl: string;
  description: string;
  descriptionNl: string;
  emoji: string;
  href: string;
}

const COLLECTIONS: Collection[] = [
  {
    id: 'v8-under-50k',
    title: 'V8 Beasts Under \u20ac50k',
    titleNl: 'V8 Monsters onder \u20ac50k',
    description: 'Big displacement, small budget',
    descriptionNl: 'Grote motoren, klein budget',
    emoji: '\ud83d\udd25',
    href: '/?horsepowerMin=300&priceMax=50000',
  },
  {
    id: 'track-toys',
    title: 'Track Day Toys',
    titleNl: 'Circuit Speeltjes',
    description: '500+ HP, built for the track',
    descriptionNl: '500+ PK, gebouwd voor het circuit',
    emoji: '\ud83c\udfc1',
    href: '/?horsepowerMin=500&bodyType=coupe',
  },
  {
    id: 'daily-luxury',
    title: 'Daily Luxury Under \u20ac30k',
    titleNl: 'Dagelijkse Luxe onder \u20ac30k',
    description: 'Premium brands, everyday prices',
    descriptionNl: 'Premium merken, alledaagse prijzen',
    emoji: '\u2728',
    href: '/?makes=BMW,Mercedes-Benz,Audi&priceMax=30000',
  },
  {
    id: 'ev-rockets',
    title: 'Electric Rockets',
    titleNl: 'Elektrische Raketten',
    description: 'Silent speed demons',
    descriptionNl: 'Stille snelheidsduivels',
    emoji: '\u26a1',
    href: '/?fuelType=electric&horsepowerMin=300',
  },
  {
    id: 'weekend-warriors',
    title: 'Weekend Warriors Under \u20ac40k',
    titleNl: 'Weekend Warriors onder \u20ac40k',
    description: 'Convertibles & roadsters for sunny days',
    descriptionNl: 'Cabrio\'s & roadsters voor zonnige dagen',
    emoji: '\u2600\ufe0f',
    href: '/?bodyType=cabriolet,roadster&priceMax=40000',
  },
  {
    id: 'supercar-bargains',
    title: 'Supercar Bargains',
    titleNl: 'Supercar Koopjes',
    description: 'Exotic metal under \u20ac100k',
    descriptionNl: 'Exotisch blik onder \u20ac100k',
    emoji: '\ud83e\udd84',
    href: '/?makes=Ferrari,Lamborghini,McLaren,Porsche&priceMax=100000',
  },
  {
    id: 'suv-power',
    title: 'Power SUVs',
    titleNl: 'Power SUVs',
    description: '400+ HP family haulers',
    descriptionNl: '400+ PK gezinsauto\'s',
    emoji: '\ud83c\udfd4\ufe0f',
    href: '/?bodyType=suv,offroad&horsepowerMin=400',
  },
  {
    id: 'youngtimers',
    title: 'Youngtimers (2000-2010)',
    titleNl: 'Youngtimers (2000-2010)',
    description: 'Future classics at today\'s prices',
    descriptionNl: 'Toekomstige klassiekers tegen de prijzen van nu',
    emoji: '\u231b',
    href: '/?yearMin=2000&yearMax=2010&horsepowerMin=250',
  },
  {
    id: 'under-100k-km',
    title: 'Low Mileage Gems',
    titleNl: 'Lage Kilometerstand',
    description: 'Under 100.000 km, barely driven',
    descriptionNl: 'Onder 100.000 km, nauwelijks gereden',
    emoji: '\ud83d\udc8e',
    href: '/?mileageMax=100000&horsepowerMin=300',
  },
];

export function CollectionsPage() {
  const { locale } = useLanguage();

  useEffect(() => {
    document.title = locale === 'nl' ? 'Collecties | OTO' : 'Collections | OTO';
    return () => { document.title = 'OTO \u2014 Online Top Occasions'; };
  }, [locale]);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {locale === 'nl' ? '\ud83c\udfaf Collecties' : '\ud83c\udfaf Collections'}
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {locale === 'nl' ? 'Samengestelde selecties voor elke smaak en budget' : 'Curated selections for every taste and budget'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTIONS.map((collection) => (
          <a
            key={collection.id}
            href={collection.href}
            className="group rounded-2xl border border-surface-200 bg-surface-50 p-5 transition-all hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-brand-accent/30"
          >
            <span className="text-2xl">{collection.emoji}</span>
            <h2 className="mt-2 text-base font-bold text-surface-900 group-hover:text-brand-accent dark:text-white">
              {locale === 'nl' ? collection.titleNl : collection.title}
            </h2>
            <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              {locale === 'nl' ? collection.descriptionNl : collection.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
