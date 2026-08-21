/**
 * Current market price trends by make+model segment.
 * Updated periodically based on marketplace analysis.
 * Positive = prices rising, negative = prices dropping.
 */
export interface MarketTrend {
  segment: string;
  trend: number; // percentage change (e.g., -3 means 3% drop)
  period: string; // "this month", "this quarter"
}

export const MARKET_TRENDS: Record<string, MarketTrend> = {
  'Porsche 911': { segment: '911', trend: -2, period: 'this quarter' },
  'Porsche Cayenne': { segment: 'Cayenne', trend: -5, period: 'this quarter' },
  'BMW M3': { segment: 'M3', trend: -4, period: 'this quarter' },
  'BMW M5': { segment: 'M5', trend: -3, period: 'this quarter' },
  'Mercedes-Benz AMG GT': { segment: 'AMG GT', trend: 2, period: 'this quarter' },
  'Audi RS6': { segment: 'RS6', trend: -1, period: 'this quarter' },
  'Ferrari 488': { segment: '488', trend: 3, period: 'this quarter' },
  'Lamborghini Huracán': { segment: 'Huracán', trend: 1, period: 'this quarter' },
  'McLaren 720S': { segment: '720S', trend: -8, period: 'this quarter' },
  'Tesla Model S': { segment: 'Model S', trend: -6, period: 'this quarter' },
  'Tesla Model 3': { segment: 'Model 3', trend: -4, period: 'this quarter' },
  'Aston Martin DB11': { segment: 'DB11', trend: -3, period: 'this quarter' },
  'Rolls-Royce Ghost': { segment: 'Ghost', trend: 2, period: 'this quarter' },
  'Bentley Continental': { segment: 'Continental', trend: -2, period: 'this quarter' },
  'Maserati Ghibli': { segment: 'Ghibli', trend: -7, period: 'this quarter' },
};

/**
 * Get the market trend for a specific make + model.
 * Returns null if no trend data is available.
 */
export function getMarketTrend(make: string, model: string): MarketTrend | null {
  // Try exact match first
  const key = `${make} ${model}`;
  if (MARKET_TRENDS[key]) return MARKET_TRENDS[key];
  
  // Try partial model match
  for (const [trendKey, trend] of Object.entries(MARKET_TRENDS)) {
    if (trendKey.includes(model) || model.includes(trend.segment)) {
      return trend;
    }
  }
  
  return null;
}
