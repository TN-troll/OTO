export type Locale = 'nl' | 'en';

export interface Translations {
  // Header
  brandName: string;
  tagline: string;

  // Search
  searchPlaceholder: string;
  searchMinChars: string;
  searchNoResults: string;
  searchShowingResultsFor: string;
  searchTrySuggestions: string;
  charsRemaining: string;

  // Filters
  filters: string;
  resetAll: string;
  filtering: string;
  carsFound: string;
  carFound: string;
  make: string;
  price: string;
  year: string;
  horsepower: string;
  engineDisplacement: string;
  transmission: string;
  fuelType: string;
  soundProfile: string;
  manual: string;
  automatic: string;
  petrol: string;
  diesel: string;
  hybrid: string;
  electric: string;
  minMaxError: string;

  // Sound filters
  engineConfiguration: string;
  cylinderCount: string;
  forcedInduction: string;
  exhaustNote: string;
  inline: string;
  vType: string;
  flatBoxer: string;
  rotary: string;
  naturallyAspirated: string;
  turbocharged: string;
  supercharged: string;
  deepRumble: string;
  highPitchedScream: string;
  aggressiveBark: string;
  smoothPurr: string;

  // Status filters
  showSoldListings: string;

  // Listings
  exclusiveCars: string;
  sortBy: string;
  dateAdded: string;
  ascending: string;
  descending: string;
  noListingsFound: string;
  noListingsHint: string;
  tryWidenPrice: string;
  removeHpFilter: string;
  fewerSoundCriteria: string;
  loading: string;
  updating: string;
  takingLonger: string;
  takingLongerHint: string;
  retry: string;
  cancel: string;
  failedToLoad: string;
  failedToLoadHint: string;
  page: string;
  of: string;
  previous: string;
  next: string;

  // Detail page
  backToListings: string;
  lastVerified: string;
  specifications: string;
  mileage: string;
  location: string;
  sellerType: string;
  dealer: string;
  private: string;
  unclassified: string;
  unclassifiedHint: string;
  engineSoundClip: string;
  audioUnavailable: string;
  originalAdvertisements: string;
  adDescription: string;
  viewOn: string;
  cylinders: string;
  induction: string;

  // Infinite scroll
  loadingMore: string;
  noMoreListings: string;
  retryLoadMore: string;
  loadMoreError: string;

  // Health banner
  unreachableSingular: string;
  unreachablePlural: string;
  dismissNotification: string;

  // Map view tabs
  tabListings: string;
  tabMap: string;
  recentlyViewed: string;
  loadingMap: string;
  mapLoadError: string;

  // Filter sections
  filterSectionPresets: string;
  filterSectionDrivetrain: string;
  filterSectionColor: string;
  filterSectionSellerType: string;
  filterSectionDoors: string;
  filterSectionSeats: string;
  filterSectionCondition: string;
  filterSectionEnginePerformance: string;
  filterSectionHeritageEdition: string;

  // Drivetrain values
  drivetrainRwd: string;
  drivetrainFwd: string;
  drivetrainAwd: string;

  // Condition values
  conditionNew: string;
  conditionUsed: string;
  conditionClassic: string;

  // Engine detail configurations
  engineConfigInline4: string;
  engineConfigInline6: string;
  engineConfigV6: string;
  engineConfigV8: string;
  engineConfigV10: string;
  engineConfigV12: string;
  engineConfigFlat4: string;
  engineConfigFlat6: string;
  engineConfigW12: string;
  engineConfigRotary: string;

  // Forced induction details
  forcedInductionNaturallyAspirated: string;
  forcedInductionTurbocharged: string;
  forcedInductionSupercharged: string;
  forcedInductionTwinTurbo: string;

  // Heritage eras
  heritageEraClassic: string;
  heritageEraModernClassic: string;
  heritageEraContemporary: string;

  // Performance presets
  presetV8GrandTourers: string;
  presetV8GrandTourersDesc: string;
  presetTrackWeapons: string;
  presetTrackWeaponsDesc: string;
  presetDailyLuxury: string;
  presetDailyLuxuryDesc: string;
  presetClassicCollectibles: string;
  presetClassicCollectiblesDesc: string;

  // Seller types (filter context)
  sellerTypeDealer: string;
  sellerTypePrivate: string;

  // Special edition
  specialEdition: string;
  specialEditionHint: string;

  // Performance figures
  accelerationMax: string;
  topSpeedMin: string;

  // Filter actions
  clearSection: string;
  showResults: string;

  // Filter chip formats
  chipPriceRange: string;
  chipYearRange: string;
  chipHorsepowerRange: string;
  chipMileageRange: string;
  chipDisplacementRange: string;
  chipAccelerationMax: string;
  chipTopSpeedMin: string;

  // Filter placeholders
  placeholderMin: string;
  placeholderMax: string;

  // Filter validation
  validationMinExceedsMax: string;
}

export const translations: Record<Locale, Translations> = {
  en: {
    brandName: 'OTO',
    tagline: 'Online Top Occasions — Luxury & Performance Cars from NL',
    searchPlaceholder: 'Search by make or model...',
    searchMinChars: 'Type at least 2 characters to search',
    searchNoResults: 'No listings found for',
    searchShowingResultsFor: 'Showing results for:',
    searchTrySuggestions: 'Try searching for:',
    charsRemaining: 'characters remaining',
    filters: 'Filters',
    resetAll: 'Reset all',
    filtering: 'Filtering...',
    carsFound: 'cars found',
    carFound: 'car found',
    make: 'Make',
    price: 'Price',
    year: 'Year',
    horsepower: 'Horsepower',
    engineDisplacement: 'Engine Displacement',
    transmission: 'Transmission',
    fuelType: 'Fuel Type',
    soundProfile: 'Sound Profile',
    manual: 'Manual',
    automatic: 'Automatic',
    petrol: 'Petrol',
    diesel: 'Diesel',
    hybrid: 'Hybrid',
    electric: 'Electric',
    minMaxError: 'Min must be ≤ max',
    engineConfiguration: 'Engine Configuration',
    cylinderCount: 'Cylinder Count',
    forcedInduction: 'Forced Induction',
    exhaustNote: 'Exhaust Note',
    inline: 'Inline',
    vType: 'V-Type',
    flatBoxer: 'Flat / Boxer',
    rotary: 'Rotary',
    naturallyAspirated: 'Naturally Aspirated',
    turbocharged: 'Turbocharged',
    supercharged: 'Supercharged',
    deepRumble: 'Deep Rumble',
    highPitchedScream: 'High-Pitched Scream',
    aggressiveBark: 'Aggressive Bark',
    smoothPurr: 'Smooth Purr',
    showSoldListings: 'Show sold listings',
    exclusiveCars: 'OTO',
    sortBy: 'Sort by:',
    dateAdded: 'Date Added',
    ascending: '↑ Asc',
    descending: '↓ Desc',
    noListingsFound: 'No listings found',
    noListingsHint: 'Try adjusting your filters to broaden your search. You can remove some criteria, expand your price or horsepower range, or try different makes and models.',
    tryWidenPrice: 'Try widening price range',
    removeHpFilter: 'Remove HP filter',
    fewerSoundCriteria: 'Check fewer sound criteria',
    loading: 'Loading listings...',
    updating: 'Updating...',
    takingLonger: 'This is taking longer than expected',
    takingLongerHint: 'The request is still processing. You can retry or cancel.',
    retry: 'Retry',
    cancel: 'Cancel',
    failedToLoad: 'Failed to load listings',
    failedToLoadHint: 'Something went wrong. Please try again.',
    page: 'Page',
    of: 'of',
    previous: '← Previous',
    next: 'Next →',
    backToListings: '← Back to listings',
    lastVerified: 'Last verified:',
    specifications: 'Specifications',
    mileage: 'Mileage',
    location: 'Location',
    sellerType: 'Seller Type',
    dealer: 'Dealer',
    private: 'Private',
    unclassified: 'Unclassified',
    unclassifiedHint: 'No sound profile data is available for this vehicle.',
    engineSoundClip: 'Engine Sound Clip',
    audioUnavailable: 'Audio unavailable — the engine sound clip could not be loaded.',
    originalAdvertisements: 'Original Advertisements',
    adDescription: 'Advertisement',
    viewOn: 'View on',
    cylinders: 'Cylinders',
    induction: 'Induction',
    loadingMore: 'Loading more listings...',
    noMoreListings: 'No more listings',
    retryLoadMore: 'Retry',
    loadMoreError: 'Failed to load more listings',
    unreachableSingular: 'is currently unreachable. Listings from this source may not be up to date.',
    unreachablePlural: 'are currently unreachable. Listings from these sources may not be up to date.',
    dismissNotification: 'Dismiss notification',
    tabListings: 'Listings',
    tabMap: 'Map',
    recentlyViewed: 'Recently Viewed',
    loadingMap: 'Loading map...',
    mapLoadError: 'Could not load map',

    // Filter sections
    filterSectionPresets: 'Quick Presets',
    filterSectionDrivetrain: 'Drivetrain',
    filterSectionColor: 'Color',
    filterSectionSellerType: 'Seller Type',
    filterSectionDoors: 'Doors',
    filterSectionSeats: 'Seats',
    filterSectionCondition: 'Condition',
    filterSectionEnginePerformance: 'Engine & Performance',
    filterSectionHeritageEdition: 'Heritage & Edition',

    // Drivetrain values
    drivetrainRwd: 'RWD',
    drivetrainFwd: 'FWD',
    drivetrainAwd: 'AWD',

    // Condition values
    conditionNew: 'New',
    conditionUsed: 'Used',
    conditionClassic: 'Classic',

    // Engine detail configurations
    engineConfigInline4: 'Inline-4',
    engineConfigInline6: 'Inline-6',
    engineConfigV6: 'V6',
    engineConfigV8: 'V8',
    engineConfigV10: 'V10',
    engineConfigV12: 'V12',
    engineConfigFlat4: 'Flat-4',
    engineConfigFlat6: 'Flat-6',
    engineConfigW12: 'W12',
    engineConfigRotary: 'Rotary',

    // Forced induction details
    forcedInductionNaturallyAspirated: 'Naturally Aspirated',
    forcedInductionTurbocharged: 'Turbocharged',
    forcedInductionSupercharged: 'Supercharged',
    forcedInductionTwinTurbo: 'Twin-Turbo',

    // Heritage eras
    heritageEraClassic: 'Classic (pre-1990)',
    heritageEraModernClassic: 'Modern Classic (1990–2010)',
    heritageEraContemporary: 'Contemporary (2010+)',

    // Performance presets
    presetV8GrandTourers: 'V8+ Grand Tourers',
    presetV8GrandTourersDesc: 'Grand touring cars with V8 or larger engines',
    presetTrackWeapons: 'Track Weapons',
    presetTrackWeaponsDesc: 'High-performance track-focused machines',
    presetDailyLuxury: 'Daily Luxury',
    presetDailyLuxuryDesc: 'Premium daily drivers from top brands',
    presetClassicCollectibles: 'Classic Collectibles',
    presetClassicCollectiblesDesc: 'Collectible classics and special editions',

    // Seller types (filter context)
    sellerTypeDealer: 'Dealer',
    sellerTypePrivate: 'Private',

    // Special edition
    specialEdition: 'Special Edition',
    specialEditionHint: 'e.g. GT3 RS, CSL, SVJ, Speciale, F40, Evo',

    // Performance figures
    accelerationMax: '0–100 km/h (max)',
    topSpeedMin: 'Top Speed (min)',

    // Filter actions
    clearSection: 'Clear',
    showResults: 'Show results',

    // Filter chip formats
    chipPriceRange: '€{min}–€{max}',
    chipYearRange: '{min}–{max}',
    chipHorsepowerRange: '{min}–{max} HP',
    chipMileageRange: '{min}–{max} km',
    chipDisplacementRange: '{min}–{max} cc',
    chipAccelerationMax: '≤ {value}s 0–100',
    chipTopSpeedMin: '≥ {value} km/h',

    // Filter placeholders
    placeholderMin: 'Min',
    placeholderMax: 'Max',

    // Filter validation
    validationMinExceedsMax: 'Minimum value cannot exceed maximum',
  },
  nl: {
    brandName: 'OTO',
    tagline: 'Online Top Occasions — Luxe & Sportauto\'s uit Nederland',
    searchPlaceholder: 'Zoek op merk of model...',
    searchMinChars: 'Typ minimaal 2 tekens om te zoeken',
    searchNoResults: 'Geen advertenties gevonden voor',
    searchShowingResultsFor: 'Resultaten voor:',
    searchTrySuggestions: 'Probeer te zoeken naar:',
    charsRemaining: 'tekens over',
    filters: 'Filters',
    resetAll: 'Alles resetten',
    filtering: 'Filteren...',
    carsFound: 'auto\'s gevonden',
    carFound: 'auto gevonden',
    make: 'Merk',
    price: 'Prijs',
    year: 'Bouwjaar',
    horsepower: 'Vermogen',
    engineDisplacement: 'Cilinderinhoud',
    transmission: 'Transmissie',
    fuelType: 'Brandstof',
    soundProfile: 'Geluidsprofiel',
    manual: 'Handgeschakeld',
    automatic: 'Automaat',
    petrol: 'Benzine',
    diesel: 'Diesel',
    hybrid: 'Hybride',
    electric: 'Elektrisch',
    minMaxError: 'Min moet ≤ max zijn',
    engineConfiguration: 'Motorconfiguratie',
    cylinderCount: 'Aantal cilinders',
    forcedInduction: 'Aandrijving',
    exhaustNote: 'Uitlaatgeluid',
    inline: 'Lijnmotor',
    vType: 'V-motor',
    flatBoxer: 'Boxermotor',
    rotary: 'Wankelmotor',
    naturallyAspirated: 'Atmosferisch',
    turbocharged: 'Turbo',
    supercharged: 'Compressor',
    deepRumble: 'Diep gebrom',
    highPitchedScream: 'Hoge schreeuw',
    aggressiveBark: 'Agressief geblaf',
    smoothPurr: 'Zacht geronk',
    showSoldListings: 'Toon verkochte auto\'s',
    exclusiveCars: 'OTO',
    sortBy: 'Sorteer op:',
    dateAdded: 'Datum toegevoegd',
    ascending: '↑ Oplopend',
    descending: '↓ Aflopend',
    noListingsFound: 'Geen advertenties gevonden',
    noListingsHint: 'Pas uw filters aan om uw zoekopdracht te verbreden. Verwijder criteria, vergroot uw prijs- of vermogensbereik, of probeer andere merken en modellen.',
    tryWidenPrice: 'Vergroot prijsbereik',
    removeHpFilter: 'Verwijder PK-filter',
    fewerSoundCriteria: 'Minder geluidscriteria',
    loading: 'Advertenties laden...',
    updating: 'Bijwerken...',
    takingLonger: 'Dit duurt langer dan verwacht',
    takingLongerHint: 'Het verzoek wordt nog verwerkt. U kunt opnieuw proberen of annuleren.',
    retry: 'Opnieuw',
    cancel: 'Annuleren',
    failedToLoad: 'Laden mislukt',
    failedToLoadHint: 'Er is iets misgegaan. Probeer het opnieuw.',
    page: 'Pagina',
    of: 'van',
    previous: '← Vorige',
    next: 'Volgende →',
    backToListings: '← Terug naar overzicht',
    lastVerified: 'Laatst geverifieerd:',
    specifications: 'Specificaties',
    mileage: 'Kilometerstand',
    location: 'Locatie',
    sellerType: 'Type verkoper',
    dealer: 'Dealer',
    private: 'Particulier',
    unclassified: 'Niet geclassificeerd',
    unclassifiedHint: 'Er is geen geluidsprofiel beschikbaar voor dit voertuig.',
    engineSoundClip: 'Motorgeluid',
    audioUnavailable: 'Audio niet beschikbaar — het motorgeluid kon niet worden geladen.',
    originalAdvertisements: 'Originele Advertenties',
    adDescription: 'Advertentietekst',
    viewOn: 'Bekijk op',
    cylinders: 'Cilinders',
    induction: 'Aandrijving',
    loadingMore: 'Meer advertenties laden...',
    noMoreListings: 'Geen advertenties meer',
    retryLoadMore: 'Opnieuw',
    loadMoreError: 'Kan meer advertenties niet laden',
    unreachableSingular: 'is momenteel onbereikbaar. Advertenties van deze bron zijn mogelijk niet actueel.',
    unreachablePlural: 'zijn momenteel onbereikbaar. Advertenties van deze bronnen zijn mogelijk niet actueel.',
    dismissNotification: 'Melding sluiten',
    tabListings: 'Overzicht',
    tabMap: 'Kaart',
    recentlyViewed: 'Laatst bekeken',
    loadingMap: 'Kaart laden...',
    mapLoadError: 'Kaart kon niet worden geladen',

    // Filter sections
    filterSectionPresets: 'Snelkeuze',
    filterSectionDrivetrain: 'Aandrijving',
    filterSectionColor: 'Kleur',
    filterSectionSellerType: 'Verkoper',
    filterSectionDoors: 'Deuren',
    filterSectionSeats: 'Zitplaatsen',
    filterSectionCondition: 'Staat',
    filterSectionEnginePerformance: 'Motor & Prestaties',
    filterSectionHeritageEdition: 'Erfgoed & Editie',

    // Drivetrain values
    drivetrainRwd: 'Achterwiel',
    drivetrainFwd: 'Voorwiel',
    drivetrainAwd: 'Vierwiel',

    // Condition values
    conditionNew: 'Nieuw',
    conditionUsed: 'Gebruikt',
    conditionClassic: 'Klassiek',

    // Engine detail configurations
    engineConfigInline4: 'Lijn-4',
    engineConfigInline6: 'Lijn-6',
    engineConfigV6: 'V6',
    engineConfigV8: 'V8',
    engineConfigV10: 'V10',
    engineConfigV12: 'V12',
    engineConfigFlat4: 'Boxer-4',
    engineConfigFlat6: 'Boxer-6',
    engineConfigW12: 'W12',
    engineConfigRotary: 'Wankel',

    // Forced induction details
    forcedInductionNaturallyAspirated: 'Atmosferisch',
    forcedInductionTurbocharged: 'Turbo',
    forcedInductionSupercharged: 'Compressor',
    forcedInductionTwinTurbo: 'Biturbo',

    // Heritage eras
    heritageEraClassic: 'Klassiek (vóór 1990)',
    heritageEraModernClassic: 'Modern Klassiek (1990–2010)',
    heritageEraContemporary: 'Hedendaags (2010+)',

    // Performance presets
    presetV8GrandTourers: 'V8+ Grand Tourers',
    presetV8GrandTourersDesc: 'Grantoerismo\'s met V8 of grotere motoren',
    presetTrackWeapons: 'Circuitwapens',
    presetTrackWeaponsDesc: 'High-performance circuitgerichte machines',
    presetDailyLuxury: 'Dagelijkse Luxe',
    presetDailyLuxuryDesc: 'Premium daily drivers van topmerken',
    presetClassicCollectibles: 'Klassieke Verzamelaars',
    presetClassicCollectiblesDesc: 'Verzamelbare klassiekers en speciale edities',

    // Seller types (filter context)
    sellerTypeDealer: 'Dealer',
    sellerTypePrivate: 'Particulier',

    // Special edition
    specialEdition: 'Speciale Editie',
    specialEditionHint: 'bijv. GT3 RS, CSL, SVJ, Speciale, F40, Evo',

    // Performance figures
    accelerationMax: '0–100 km/u (max)',
    topSpeedMin: 'Topsnelheid (min)',

    // Filter actions
    clearSection: 'Wissen',
    showResults: 'Toon resultaten',

    // Filter chip formats
    chipPriceRange: '€{min}–€{max}',
    chipYearRange: '{min}–{max}',
    chipHorsepowerRange: '{min}–{max} PK',
    chipMileageRange: '{min}–{max} km',
    chipDisplacementRange: '{min}–{max} cc',
    chipAccelerationMax: '≤ {value}s 0–100',
    chipTopSpeedMin: '≥ {value} km/u',

    // Filter placeholders
    placeholderMin: 'Min',
    placeholderMax: 'Max',

    // Filter validation
    validationMinExceedsMax: 'Minimumwaarde mag niet hoger zijn dan maximum',
  },
};
