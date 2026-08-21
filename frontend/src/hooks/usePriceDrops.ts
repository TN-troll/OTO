import { useState } from 'react';

const STORAGE_KEY = 'oto-price-tracker';

interface PriceRecord {
  [listingId: string]: number; // last known price
}

function getTrackedPrices(): PriceRecord {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

/**
 * Tracks listing prices and detects drops.
 * Records the first price seen for each listing, then compares on subsequent views.
 */
export function usePriceDrops() {
  const [drops, setDrops] = useState<Record<string, number>>({});

  /**
   * Record a listing's current price. If it's lower than the previously
   * recorded price, marks it as a price drop.
   */
  const trackPrice = (listingId: string, currentPrice: number) => {
    const tracked = getTrackedPrices();
    const previousPrice = tracked[listingId];
    
    if (previousPrice !== undefined && currentPrice < previousPrice) {
      setDrops(prev => ({
        ...prev,
        [listingId]: previousPrice - currentPrice,
      }));
    }
    
    // Update tracked price
    tracked[listingId] = currentPrice;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tracked)); } catch {}
  };

  const getDropAmount = (listingId: string): number | null => {
    return drops[listingId] ?? null;
  };

  return { trackPrice, getDropAmount, drops };
}
