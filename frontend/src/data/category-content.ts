/**
 * Category editorial content — descriptions and curated article links.
 * Sources: evo.co.uk, carwow.co.uk, topgear.com, caranddriver.com, edmunds.com
 */

export interface CategoryContent {
  descriptionNl: string;
  descriptionEn: string;
  articles: { title: string; url: string; source: string }[];
}

export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  supercar: {
    descriptionEn: 'The pinnacle of automotive engineering. These mid-engine, rear-wheel drive machines deliver jaw-dropping performance with 600+ horsepower, sub-3 second 0-100 times, and top speeds exceeding 300 km/h. From the Italian wedge shapes of Ferrari and Lamborghini to the carbon fiber precision of McLaren.',
    descriptionNl: 'Het toppunt van auto-engineering. Deze middenmotor machines leveren adembenemende prestaties met 600+ pk, 0-100 in minder dan 3 seconden, en topsnelheden boven de 300 km/u. Van de Italiaanse wigvormen van Ferrari en Lamborghini tot de koolstofvezel precisie van McLaren.',
    articles: [
      { title: 'Best Supercars 2026 — The Ultimate Driver\'s Cars', url: 'https://www.evo.co.uk/best-cars/13441/best-supercars-2026-the-ultimate-show-stopping-drivers-cars', source: 'evo.co.uk' },
      { title: 'The Best Supercars and Exotic Cars to Buy', url: 'https://www.carwow.co.uk/best/best-supercars', source: 'carwow.co.uk' },
      { title: 'Best Hypercars — From Bugatti to Pagani', url: 'https://www.evo.co.uk/best-cars/20652/best-hypercars', source: 'evo.co.uk' },
    ],
  },
  luxury: {
    descriptionEn: 'Hand-crafted grand tourers and limousines that represent the height of automotive luxury. Rolls-Royce, Bentley, and Aston Martin offer bespoke interiors, whisper-quiet cabins, and effortless performance. These are cars built for those who appreciate the finest craftsmanship.',
    descriptionNl: 'Handgemaakte grand tourers en limousines die het toppunt van autoluxe vertegenwoordigen. Rolls-Royce, Bentley en Aston Martin bieden op maat gemaakte interieurs, fluisterstille cabines en moeiteloze prestaties. Auto\'s voor wie het allerbeste waardeert.',
    articles: [
      { title: 'Rolls-Royce Spectre Review — Electric Ultra-Luxury', url: 'https://www.topgear.com/car-reviews/rolls-royce/spectre', source: 'Top Gear' },
      { title: 'Bentley Continental GT Review', url: 'https://www.topgear.com/car-reviews/bentley/continental-gt', source: 'Top Gear' },
      { title: 'Aston Martin DB12 — The Super Tourer Redefined', url: 'https://www.evo.co.uk/aston-martin/db12', source: 'evo.co.uk' },
    ],
  },
  'performance-sedan': {
    descriptionEn: 'The best of both worlds: four-door practicality meets supercar-rivaling performance. BMW M, Mercedes-AMG, and Audi RS divisions transform everyday sedans into track-capable machines with 500-800+ horsepower, all-wheel drive systems, and advanced aerodynamics.',
    descriptionNl: 'Het beste van twee werelden: vierdeurs praktisch gemak met supercar-prestaties. BMW M, Mercedes-AMG en Audi RS transformeren dagelijkse sedans in circuitwaardige machines met 500-800+ pk, vierwielaandrijving en geavanceerde aerodynamica.',
    articles: [
      { title: 'Audi RS vs BMW M vs Mercedes-AMG — German Performance Philosophies', url: 'https://carbuzz.com/audi-rs-vs-bmw-m-vs-mercedes-amg/', source: 'CarBuzz' },
      { title: 'BMW M5 — The Performance Sedan Icon', url: 'https://www.bmw-m.com/en/all-models/overview-m-and-m-performance/bmw-m5-sedan/2024/bmw-m5-sedan.html', source: 'BMW M' },
      { title: 'Best Performance Sedans to Buy', url: 'https://www.caranddriver.com/rankings/best-sports-cars/sport-sedans', source: 'Car and Driver' },
    ],
  },
  'hot-hatch': {
    descriptionEn: 'Small proportions, nimble handling, and revvy engines make hot hatches some of the best driver\'s cars. From the legendary VW Golf GTI to the record-breaking Honda Civic Type R and the rally-bred Toyota GR Yaris — pure driving joy at attainable prices.',
    descriptionNl: 'Compacte afmetingen, wendbaar weggedrag en enthousiaste motoren maken hot hatches tot de beste rijdersauto\'s. Van de legendarische VW Golf GTI tot de recordbrekende Honda Civic Type R en de rallygeïnspireerde Toyota GR Yaris — puur rijplezier voor bereikbare prijzen.',
    articles: [
      { title: 'VW Golf GTI Edition 50 vs GR Yaris vs Civic Type R', url: 'https://www.evo.co.uk/group-tests/208815/vw-golf-gti-edition-50-v-toyota-gr-yaris-aero-v-honda-civic-type-r-hot-hatch', source: 'evo.co.uk' },
      { title: 'Best Hot Hatches to Buy in 2026', url: 'https://www.carwow.co.uk/hot-hatches', source: 'carwow.co.uk' },
      { title: '2026 Hot Hatchbacks Rated', url: 'https://carbuzz.com/cars/hot-hatches/', source: 'CarBuzz' },
    ],
  },
  'sports-car': {
    descriptionEn: 'Purpose-built two-door performance machines. The Porsche 911 defines the rear-engine sports car formula, while the Lotus Emira offers lightweight purity, the Jaguar F-Type provides British muscle, and the Nissan GT-R delivers supercar performance at a fraction of the price.',
    descriptionNl: 'Speciaal gebouwde tweezits prestatiemachines. De Porsche 911 definieert de achtermotorsportwagen, de Lotus Emira biedt lichtgewicht puurheid, de Jaguar F-Type levert Britse kracht, en de Nissan GT-R biedt supercarprestaties voor een fractie van de prijs.',
    articles: [
      { title: 'Best Sports Cars — Porsche 911 and Rivals', url: 'https://www.evo.co.uk/best-cars/best-sports-cars', source: 'evo.co.uk' },
      { title: 'Porsche 911 — Still the Benchmark After 60 Years', url: 'https://www.topgear.com/car-reviews/porsche/911', source: 'Top Gear' },
      { title: 'Best Sports Cars for 2026', url: 'https://www.caranddriver.com/rankings/best-sports-cars', source: 'Car and Driver' },
    ],
  },
  suv: {
    descriptionEn: 'Performance SUVs combine supercar acceleration with elevated ride height and family practicality. The Lamborghini Urus and Porsche Cayenne Turbo GT prove physics can be defied, while the Mercedes G63 AMG and BMW X5 M offer brute force in a commanding package.',
    descriptionNl: 'Performance SUV\'s combineren supercar-acceleratie met verhoogde rijhoogte en gezinspraktijk. De Lamborghini Urus en Porsche Cayenne Turbo GT bewijzen dat de natuurwetten overwonnen kunnen worden, terwijl de Mercedes G63 AMG en BMW X5 M brute kracht bieden in een imposant pakket.',
    articles: [
      { title: 'Lamborghini Urus Review — The Super SUV', url: 'https://www.topgear.com/car-reviews/lamborghini/urus', source: 'Top Gear' },
      { title: 'Porsche Cayenne — The Performance SUV Benchmark', url: 'https://www.edmunds.com/porsche/cayenne/', source: 'Edmunds' },
      { title: 'Best Performance SUVs of 2025', url: 'https://www.edmunds.com/best/performance-midsize-suv/', source: 'Edmunds' },
    ],
  },
  electric: {
    descriptionEn: 'The future of performance is electric. Instant torque delivery enables brutal acceleration — the Porsche Taycan Turbo S hits 100 km/h in 2.8 seconds, while the Hyundai Ioniq 5 N brings hot hatch fun to EVs. Lotus Eletre and Emeya prove electric luxury can thrill.',
    descriptionNl: 'De toekomst van performance is elektrisch. Instant koppellevering zorgt voor brutale acceleratie — de Porsche Taycan Turbo S haalt 100 km/u in 2,8 seconden, terwijl de Hyundai Ioniq 5 N hot hatch-plezier naar EV\'s brengt. Lotus Eletre en Emeya bewijzen dat elektrische luxe kan opwinden.',
    articles: [
      { title: 'Best Electric Hot Hatches 2026', url: 'https://www.carwow.co.uk/hot-hatches/electric', source: 'carwow.co.uk' },
      { title: 'Porsche Taycan — The Electric Sports Car', url: 'https://www.topgear.com/car-reviews/porsche/taycan', source: 'Top Gear' },
      { title: 'Hyundai Ioniq 5 N Review — EV Meets Hot Hatch', url: 'https://www.evo.co.uk/hyundai/ioniq-5-n', source: 'evo.co.uk' },
    ],
  },
};
