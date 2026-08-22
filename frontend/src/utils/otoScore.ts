import type { ListingSummary } from '@car-ads/shared';

/**
 * OTO Score™ — proprietary 1-100 rating for each listing.
 * Combines: price fairness, mileage relative to age, and power/value ratio.
 * Higher = better deal.
 */
export function calculateOtoScore(listing: ListingSummary): number | null {
  const { price, horsepower, mileage, year, marketAvgPrice } = listing;

  if (!price || price <= 0) return null;

  let score = 50; // Base score

  // 1. Price fairness (0-30 points)
  if (marketAvgPrice && marketAvgPrice > 0) {
    const priceRatio = price / marketAvgPrice;
    if (priceRatio < 0.8) score += 30;
    else if (priceRatio < 0.9) score += 20;
    else if (priceRatio < 1.0) score += 10;
    else if (priceRatio > 1.2) score -= 15;
    else if (priceRatio > 1.1) score -= 5;
  } else if (horsepower && horsepower > 0) {
    // Fallback: €/HP ratio
    const pricePerHp = price / horsepower;
    if (pricePerHp < 100) score += 25;
    else if (pricePerHp < 200) score += 15;
    else if (pricePerHp < 300) score += 5;
    else if (pricePerHp > 500) score -= 10;
  }

  // 2. Mileage relative to age (0-20 points)
  if (mileage != null && year) {
    const age = new Date().getFullYear() - year;
    const expectedKm = age * 15000; // Average 15k km/year
    if (expectedKm > 0) {
      const mileageRatio = mileage / expectedKm;
      if (mileageRatio < 0.5) score += 20; // Very low mileage
      else if (mileageRatio < 0.8) score += 10;
      else if (mileageRatio > 1.5) score -= 10; // High mileage
      else if (mileageRatio > 2.0) score -= 15;
    }
  }

  // 3. Power-to-price value (0-15 points)
  if (horsepower && horsepower > 0) {
    if (horsepower > 500 && price < 100000) score += 15;
    else if (horsepower > 400 && price < 80000) score += 10;
    else if (horsepower > 300 && price < 50000) score += 5;
  }

  // 4. Freshness bonus (0-5 points)
  if (listing.dateAdded) {
    const daysListed = (Date.now() - new Date(listing.dateAdded).getTime()) / 86400000;
    if (daysListed < 3) score += 5;
    else if (daysListed < 7) score += 3;
  }

  // Clamp to 1-100
  return Math.max(1, Math.min(100, Math.round(score)));
}

/**
 * Get the color class for an OTO Score value.
 */
export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-500';
  if (score >= 50) return 'text-brand-accent';
  if (score >= 30) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get the background color class for an OTO Score badge.
 */
export function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-green-500/10 border-green-500/30';
  if (score >= 50) return 'bg-brand-accent/10 border-brand-accent/30';
  if (score >= 30) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
}
