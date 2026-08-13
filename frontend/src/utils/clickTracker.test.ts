import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackClick, handleTrackedClick } from './clickTracker';

describe('clickTracker', () => {
  let originalFetch: typeof globalThis.fetch;
  let originalSessionStorage: Storage;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    // Mock sessionStorage
    const store: Record<string, string> = {};
    originalSessionStorage = globalThis.sessionStorage;
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => Object.keys(store).forEach(k => delete store[k]),
        length: 0,
        key: () => null,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('trackClick', () => {
    it('should call the track-click endpoint and return the redirect URL', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ redirectUrl: 'https://www.autoscout24.nl/listing/123' }),
      });

      const result = await trackClick('listing-1', 'https://fallback.url');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings/listing-1/track-click'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result.redirectUrl).toBe('https://www.autoscout24.nl/listing/123');
      expect(result.tracked).toBe(true);
    });

    it('should return fallback URL when API returns non-OK response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await trackClick('listing-1', 'https://fallback.url');

      expect(result.redirectUrl).toBe('https://fallback.url');
      expect(result.tracked).toBe(false);
    });

    it('should return fallback URL when fetch throws (network error)', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await trackClick('listing-1', 'https://fallback.url');

      expect(result.redirectUrl).toBe('https://fallback.url');
      expect(result.tracked).toBe(false);
    });

    it('should include a sessionId in the request body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ redirectUrl: 'https://example.com' }),
      });

      await trackClick('listing-1', 'https://fallback.url');

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.sessionId).toBeDefined();
      expect(typeof body.sessionId).toBe('string');
      expect(body.sessionId.startsWith('session-')).toBe(true);
    });

    it('should reuse the same session ID across calls', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ redirectUrl: 'https://example.com' }),
      });

      await trackClick('listing-1', 'https://fallback.url');
      await trackClick('listing-2', 'https://fallback.url');

      const firstBody = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
      const secondBody = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body);
      expect(firstBody.sessionId).toBe(secondBody.sessionId);
    });

    it('should use fallback URL when API returns empty redirectUrl', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ redirectUrl: '' }),
      });

      const result = await trackClick('listing-1', 'https://fallback.url');

      expect(result.redirectUrl).toBe('https://fallback.url');
      expect(result.tracked).toBe(true);
    });
  });

  describe('handleTrackedClick', () => {
    it('should open the redirect URL in a new tab', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ redirectUrl: 'https://www.autoscout24.nl/listing/456' }),
      });

      const openSpy = vi.fn();
      globalThis.window = { ...globalThis.window, open: openSpy } as unknown as Window & typeof globalThis;

      await handleTrackedClick('listing-1', 'https://original.url', true);

      expect(openSpy).toHaveBeenCalledWith(
        'https://www.autoscout24.nl/listing/456',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('should redirect in same tab when openInNewTab is false', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ redirectUrl: 'https://www.autoscout24.nl/listing/456' }),
      });

      // Mock window.location
      const locationMock = { href: '' };
      Object.defineProperty(globalThis, 'window', {
        value: { ...globalThis.window, location: locationMock },
        writable: true,
        configurable: true,
      });

      await handleTrackedClick('listing-1', 'https://original.url', false);

      expect(locationMock.href).toBe('https://www.autoscout24.nl/listing/456');
    });

    it('should still redirect to original URL on tracking failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const openSpy = vi.fn();
      globalThis.window = { ...globalThis.window, open: openSpy } as unknown as Window & typeof globalThis;

      await handleTrackedClick('listing-1', 'https://original.url', true);

      expect(openSpy).toHaveBeenCalledWith(
        'https://original.url',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });
});
