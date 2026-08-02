import { describe, it, expect } from 'vitest';
import type { MarketplaceHealth } from '@car-ads/shared';

/**
 * Unit tests for MarketplaceHealthBanner logic.
 * These tests validate the core logic without DOM rendering.
 */

const MARKETPLACE_NAMES: Record<string, string> = {
  autotrack: 'AutoTrack',
  autoscout24: 'AutoScout24',
  marktplaats: 'Marktplaats',
};

function getMarketplaceName(id: string): string {
  return MARKETPLACE_NAMES[id] || id;
}

function getUnreachableMarketplaces(healthData: MarketplaceHealth[]): MarketplaceHealth[] {
  return healthData.filter((m) => m.status === 'unreachable');
}

function buildBannerMessage(unreachable: MarketplaceHealth[]): string | null {
  if (unreachable.length === 0) return null;

  const names = unreachable.map((m) => getMarketplaceName(m.marketplace));
  const marketplaceList = names.join(', ');
  const plural = names.length > 1;

  return `${marketplaceList} ${plural ? 'are' : 'is'} currently unreachable. Listings from ${plural ? 'these sources' : 'this source'} may not be up to date.`;
}

function shouldResetDismissed(prevIds: string[], currentIds: string[]): boolean {
  const prevKey = [...prevIds].sort().join(',');
  const currentKey = [...currentIds].sort().join(',');
  return prevKey !== currentKey;
}

describe('MarketplaceHealthBanner logic', () => {
  describe('Filtering unreachable marketplaces', () => {
    it('returns empty array when all marketplaces are healthy', () => {
      const data: MarketplaceHealth[] = [
        { marketplace: 'autotrack', status: 'healthy', lastSuccessfulContact: new Date(), consecutiveFailures: 0, unreachableSince: null },
        { marketplace: 'autoscout24', status: 'healthy', lastSuccessfulContact: new Date(), consecutiveFailures: 0, unreachableSince: null },
      ];
      expect(getUnreachableMarketplaces(data)).toHaveLength(0);
    });

    it('returns only unreachable marketplaces', () => {
      const data: MarketplaceHealth[] = [
        { marketplace: 'autotrack', status: 'unreachable', lastSuccessfulContact: new Date(), consecutiveFailures: 5, unreachableSince: new Date() },
        { marketplace: 'autoscout24', status: 'healthy', lastSuccessfulContact: new Date(), consecutiveFailures: 0, unreachableSince: null },
        { marketplace: 'marktplaats', status: 'unreachable', lastSuccessfulContact: new Date(), consecutiveFailures: 3, unreachableSince: new Date() },
      ];
      const result = getUnreachableMarketplaces(data);
      expect(result).toHaveLength(2);
      expect(result.map((m) => m.marketplace)).toEqual(['autotrack', 'marktplaats']);
    });

    it('does not include degraded marketplaces', () => {
      const data: MarketplaceHealth[] = [
        { marketplace: 'autotrack', status: 'degraded', lastSuccessfulContact: new Date(), consecutiveFailures: 1, unreachableSince: null },
      ];
      expect(getUnreachableMarketplaces(data)).toHaveLength(0);
    });
  });

  describe('Banner message construction', () => {
    it('returns null when no marketplaces are unreachable', () => {
      expect(buildBannerMessage([])).toBeNull();
    });

    it('uses singular form for one unreachable marketplace', () => {
      const unreachable: MarketplaceHealth[] = [
        { marketplace: 'autotrack', status: 'unreachable', lastSuccessfulContact: new Date(), consecutiveFailures: 5, unreachableSince: new Date() },
      ];
      const message = buildBannerMessage(unreachable);
      expect(message).toBe('AutoTrack is currently unreachable. Listings from this source may not be up to date.');
    });

    it('uses plural form for multiple unreachable marketplaces', () => {
      const unreachable: MarketplaceHealth[] = [
        { marketplace: 'autotrack', status: 'unreachable', lastSuccessfulContact: new Date(), consecutiveFailures: 5, unreachableSince: new Date() },
        { marketplace: 'marktplaats', status: 'unreachable', lastSuccessfulContact: new Date(), consecutiveFailures: 3, unreachableSince: new Date() },
      ];
      const message = buildBannerMessage(unreachable);
      expect(message).toBe('AutoTrack, Marktplaats are currently unreachable. Listings from these sources may not be up to date.');
    });

    it('uses marketplace ID as fallback name for unknown marketplace', () => {
      const unreachable: MarketplaceHealth[] = [
        { marketplace: 'unknown-marketplace' as any, status: 'unreachable', lastSuccessfulContact: new Date(), consecutiveFailures: 5, unreachableSince: new Date() },
      ];
      const message = buildBannerMessage(unreachable);
      expect(message).toContain('unknown-marketplace');
    });
  });

  describe('Dismissed state reset logic', () => {
    it('resets dismissed when a new marketplace becomes unreachable', () => {
      const prev = ['autotrack'];
      const current = ['autotrack', 'marktplaats'];
      expect(shouldResetDismissed(prev, current)).toBe(true);
    });

    it('resets dismissed when all marketplaces recover', () => {
      const prev = ['autotrack'];
      const current: string[] = [];
      expect(shouldResetDismissed(prev, current)).toBe(true);
    });

    it('does not reset when unreachable set is unchanged', () => {
      const prev = ['autotrack', 'marktplaats'];
      const current = ['marktplaats', 'autotrack']; // same set, different order
      expect(shouldResetDismissed(prev, current)).toBe(false);
    });

    it('resets dismissed when a marketplace recovers but another is still unreachable', () => {
      const prev = ['autotrack', 'marktplaats'];
      const current = ['marktplaats'];
      expect(shouldResetDismissed(prev, current)).toBe(true);
    });
  });

  describe('Marketplace name lookup', () => {
    it('returns correct display names for known marketplaces', () => {
      expect(getMarketplaceName('autotrack')).toBe('AutoTrack');
      expect(getMarketplaceName('autoscout24')).toBe('AutoScout24');
      expect(getMarketplaceName('marktplaats')).toBe('Marktplaats');
    });

    it('returns the ID as fallback for unknown marketplaces', () => {
      expect(getMarketplaceName('some-new-marketplace')).toBe('some-new-marketplace');
    });
  });
});
