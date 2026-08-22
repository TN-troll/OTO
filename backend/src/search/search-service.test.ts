import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService, SearchValidationError } from './search-service.js';

// Mock the database connection module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../db/connection.js';

const mockedQuery = vi.mocked(query);

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SearchService();
  });

  describe('validateQuery', () => {
    it('should return valid for queries between 2 and 100 characters', () => {
      const result = service.validateQuery('ferrari');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for queries shorter than 2 characters', () => {
      const result = service.validateQuery('f');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('searchQuery');
      expect(result.errors[0].message).toContain('at least 2');
    });

    it('should return invalid for empty string', () => {
      const result = service.validateQuery('');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should return invalid for queries longer than 100 characters', () => {
      const longQuery = 'a'.repeat(101);
      const result = service.validateQuery(longQuery);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('searchQuery');
      expect(result.errors[0].message).toContain('100');
    });

    it('should return valid for exactly 2 characters', () => {
      const result = service.validateQuery('ab');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for exactly 100 characters', () => {
      const result = service.validateQuery('a'.repeat(100));
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('expandAbbreviation', () => {
    it('should expand "merc" to "Mercedes-Benz"', () => {
      expect(service.expandAbbreviation('merc')).toBe('Mercedes-Benz');
    });

    it('should expand "mercedes" to "Mercedes-Benz"', () => {
      expect(service.expandAbbreviation('mercedes')).toBe('Mercedes-Benz');
    });

    it('should expand "chevy" to "Chevrolet"', () => {
      expect(service.expandAbbreviation('chevy')).toBe('Chevrolet');
    });

    it('should expand "lambo" to "Lamborghini"', () => {
      expect(service.expandAbbreviation('lambo')).toBe('Lamborghini');
    });

    it('should expand "beemer" to "BMW"', () => {
      expect(service.expandAbbreviation('beemer')).toBe('BMW');
    });

    it('should expand "bimmer" to "BMW"', () => {
      expect(service.expandAbbreviation('bimmer')).toBe('BMW');
    });

    it('should expand "vette" to "Corvette"', () => {
      expect(service.expandAbbreviation('vette')).toBe('Corvette');
    });

    it('should expand "aston" to "Aston Martin"', () => {
      expect(service.expandAbbreviation('aston')).toBe('Aston Martin');
    });

    it('should expand "astonmartin" to "Aston Martin"', () => {
      expect(service.expandAbbreviation('astonmartin')).toBe('Aston Martin');
    });

    it('should be case-insensitive when expanding', () => {
      expect(service.expandAbbreviation('MERC')).toBe('Mercedes-Benz');
      expect(service.expandAbbreviation('Lambo')).toBe('Lamborghini');
      expect(service.expandAbbreviation('CHEVY')).toBe('Chevrolet');
    });

    it('should return the original query if no abbreviation matches', () => {
      expect(service.expandAbbreviation('ferrari')).toBe('ferrari');
      expect(service.expandAbbreviation('unknown')).toBe('unknown');
    });

    it('should handle trimming whitespace', () => {
      expect(service.expandAbbreviation('  merc  ')).toBe('Mercedes-Benz');
    });
  });

  describe('search', () => {
    it('should return empty results for queries shorter than 2 characters', async () => {
      const result = await service.search('f');
      expect(result.listings).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.expandedQuery).toBeNull();
      expect(result.suggestions).toHaveLength(0);
      expect(mockedQuery).not.toHaveBeenCalled();
    });

    it('should throw SearchValidationError for queries longer than 100 characters', async () => {
      const longQuery = 'a'.repeat(101);
      await expect(service.search(longQuery)).rejects.toThrow(SearchValidationError);
      expect(mockedQuery).not.toHaveBeenCalled();
    });

    it('should perform case-insensitive search using ILIKE', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            title: 'Ferrari 488 GTB',
            make: 'Ferrari',
            model: '488 GTB',
            year: 2020,
            price: 250000,
            horsepower: 670,
            engine_displacement_cc: 3902,
            image_urls: ['https://example.com/img1.jpg'],
            date_added: new Date('2024-01-01'),
          },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.search('ferrari');

      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].make).toBe('Ferrari');
      expect(result.totalCount).toBe(1);
      expect(result.expandedQuery).toBeNull();

      // Verify that the query uses ILIKE
      expect(mockedQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockedQuery.mock.calls[0];
      expect(sql).toContain('ILIKE');
      expect(params).toContain('%ferrari%');
    });

    it('should expand abbreviation and set expandedQuery', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '2',
            title: 'Mercedes-Benz AMG GT',
            make: 'Mercedes-Benz',
            model: 'AMG GT',
            year: 2021,
            price: 180000,
            horsepower: 577,
            engine_displacement_cc: 3982,
            image_urls: [],
            date_added: new Date('2024-02-01'),
          },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.search('merc');

      expect(result.expandedQuery).toBe('Mercedes-Benz');
      expect(result.listings).toHaveLength(1);

      // Verify expanded term is used in the query
      const [, params] = mockedQuery.mock.calls[0];
      expect(params).toContain('%Mercedes-Benz%');
    });

    it('should generate suggestions when no results found', async () => {
      // First call: main search returns no results
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Second call: suggestions query
      mockedQuery.mockResolvedValueOnce({
        rows: [
          { suggestion: 'Ferrari' },
          { suggestion: 'Ford' },
        ],
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const result = await service.search('fords');

      expect(result.listings).toHaveLength(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should combine search with active filter criteria', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Suggestions call
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Fallback suggestions
      mockedQuery.mockResolvedValueOnce({
        rows: [{ suggestion: 'BMW' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await service.search('bmw', {
        horsepowerMin: 400,
        yearMin: 2020,
        priceMax: 200000,
      });

      const [sql, params] = mockedQuery.mock.calls[0];
      expect(sql).toContain('horsepower >= ');
      expect(sql).toContain('year >= ');
      expect(sql).toContain('price <= ');
      expect(params).toContain(400);
      expect(params).toContain(2020);
      expect(params).toContain(200000);
    });

    it('should map database rows to ListingSummary correctly', async () => {
      const dateAdded = new Date('2024-03-15');
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'abc-123',
            title: 'Lamborghini Huracan EVO',
            make: 'Lamborghini',
            model: 'Huracan EVO',
            year: 2022,
            price: 300000,
            horsepower: 640,
            engine_displacement_cc: 5204,
            image_urls: ['https://cdn.example.com/lambo1.jpg', 'https://cdn.example.com/lambo2.jpg'],
            date_added: dateAdded,
          },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.search('lambo');

      expect(result.listings[0]).toMatchObject({
        id: 'abc-123',
        title: 'Lamborghini Huracan EVO',
        primaryImageUrl: 'https://cdn.example.com/lambo1.jpg',
        make: 'Lamborghini',
        model: 'Huracan EVO',
        year: 2022,
        price: 300000,
        horsepower: 640,
        engineDisplacementCc: 5204,
        dateAdded: dateAdded,
      });
    });

    it('should set primaryImageUrl to null when no images available', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            title: 'BMW M5',
            make: 'BMW',
            model: 'M5',
            year: 2021,
            price: 120000,
            horsepower: 600,
            engine_displacement_cc: 4395,
            image_urls: [],
            date_added: new Date(),
          },
        ],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.search('BMW');
      expect(result.listings[0].primaryImageUrl).toBeNull();
    });

    it('should apply transmission type filter', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });
      mockedQuery.mockResolvedValueOnce({
        rows: [{ suggestion: 'Porsche' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await service.search('porsche', {
        transmissionType: ['manual'],
      });

      const [sql, params] = mockedQuery.mock.calls[0];
      expect(sql).toContain('transmission_type = ANY');
      expect(params).toContainEqual(['manual']);
    });

    it('should apply fuel type filter', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });
      mockedQuery.mockResolvedValueOnce({
        rows: [{ suggestion: 'Tesla' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await service.search('porsche', {
        fuelType: ['petrol', 'hybrid'],
      });

      const [sql, params] = mockedQuery.mock.calls[0];
      expect(sql).toContain('fuel_type = ANY');
      expect(params).toContainEqual(['petrol', 'hybrid']);
    });
  });

  describe('getSuggestions', () => {
    it('should return matching makes and models', async () => {
      mockedQuery.mockResolvedValueOnce({
        rows: [
          { suggestion: 'Ferrari' },
          { suggestion: 'F8 Tributo' },
        ],
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const suggestions = await service.getSuggestions('ferr');
      expect(suggestions).toEqual(['Ferrari', 'F8 Tributo']);
    });

    it('should return fallback suggestions when no similar terms found', async () => {
      // First query (similar matches) returns empty
      mockedQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Fallback query returns some makes
      mockedQuery.mockResolvedValueOnce({
        rows: [
          { suggestion: 'Aston Martin' },
          { suggestion: 'BMW' },
          { suggestion: 'Ferrari' },
        ],
        command: 'SELECT',
        rowCount: 3,
        oid: 0,
        fields: [],
      });

      const suggestions = await service.getSuggestions('xyznonexistent');
      expect(suggestions).toEqual(['Aston Martin', 'BMW', 'Ferrari']);
    });
  });

  describe('updateAbbreviations', () => {
    it('should add new abbreviations to the map', () => {
      service.updateAbbreviations({ rolls: 'Rolls-Royce' });
      expect(service.expandAbbreviation('rolls')).toBe('Rolls-Royce');
    });

    it('should override existing abbreviations', () => {
      service.updateAbbreviations({ merc: 'Mercedes-AMG' });
      expect(service.expandAbbreviation('merc')).toBe('Mercedes-AMG');
    });

    it('should preserve existing abbreviations not being updated', () => {
      service.updateAbbreviations({ rolls: 'Rolls-Royce' });
      expect(service.expandAbbreviation('lambo')).toBe('Lamborghini');
    });
  });

  describe('getAbbreviations', () => {
    it('should return a copy of the abbreviation map', () => {
      const abbreviations = service.getAbbreviations();
      expect(abbreviations).toHaveProperty('merc', 'Mercedes-Benz');
      expect(abbreviations).toHaveProperty('chevy', 'Chevrolet');

      // Verify it's a copy (modifying it doesn't affect the service)
      abbreviations['test'] = 'Test';
      expect(service.expandAbbreviation('test')).toBe('test');
    });
  });

  describe('custom abbreviations via constructor', () => {
    it('should use custom abbreviation map when provided', () => {
      const customService = new SearchService({
        rr: 'Rolls-Royce',
        fezza: 'Ferrari',
      });

      expect(customService.expandAbbreviation('rr')).toBe('Rolls-Royce');
      expect(customService.expandAbbreviation('fezza')).toBe('Ferrari');
      // Default abbreviations should not be available
      expect(customService.expandAbbreviation('merc')).toBe('merc');
    });
  });
});
