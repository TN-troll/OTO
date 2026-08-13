import { describe, it, expect } from 'vitest';
import { getProxyImageUrl, getProxyImageUrls } from './imageProxy';

describe('getProxyImageUrl', () => {
  it('should encode an external image URL through the proxy endpoint', () => {
    const url = 'https://prod.pictures.autoscout24.net/listing-images/abc123/image.jpg';
    const result = getProxyImageUrl(url);
    expect(result).toBe(`/api/images/${encodeURIComponent(url)}`);
  });

  it('should return empty string for null or undefined input', () => {
    expect(getProxyImageUrl(null)).toBe('');
    expect(getProxyImageUrl(undefined)).toBe('');
    expect(getProxyImageUrl('')).toBe('');
  });

  it('should not double-proxy URLs that already go through /api/images/', () => {
    const alreadyProxied = '/api/images/https%3A%2F%2Fexample.com%2Fimage.jpg';
    expect(getProxyImageUrl(alreadyProxied)).toBe(alreadyProxied);
  });

  it('should not proxy data: URLs', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANS';
    expect(getProxyImageUrl(dataUrl)).toBe(dataUrl);
  });

  it('should not proxy blob: URLs', () => {
    const blobUrl = 'blob:http://localhost:3000/abc123';
    expect(getProxyImageUrl(blobUrl)).toBe(blobUrl);
  });

  it('should handle URLs with special characters', () => {
    const url = 'https://example.com/image?w=400&h=300&fit=crop';
    const result = getProxyImageUrl(url);
    expect(result).toBe(`/api/images/${encodeURIComponent(url)}`);
  });

  it('should produce a URL that the backend can decode back to the original', () => {
    const original = 'https://prod.pictures.autoscout24.net/listing-images/1234/image.jpg';
    const proxyUrl = getProxyImageUrl(original);
    // Extract the encoded part and decode it
    const encodedPart = proxyUrl.replace('/api/images/', '');
    expect(decodeURIComponent(encodedPart)).toBe(original);
  });
});

describe('getProxyImageUrls', () => {
  it('should convert an array of URLs to proxied URLs', () => {
    const urls = [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
    ];
    const result = getProxyImageUrls(urls);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(`/api/images/${encodeURIComponent(urls[0])}`);
    expect(result[1]).toBe(`/api/images/${encodeURIComponent(urls[1])}`);
  });

  it('should return empty array for null or undefined input', () => {
    expect(getProxyImageUrls(null)).toEqual([]);
    expect(getProxyImageUrls(undefined)).toEqual([]);
    expect(getProxyImageUrls([])).toEqual([]);
  });
});
