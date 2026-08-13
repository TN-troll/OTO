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
  },
};
