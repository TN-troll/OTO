/**
 * Mock API server that serves in-memory sample data.
 * No PostgreSQL or Redis required.
 */
import express from 'express';
import { MOCK_LISTINGS, MockListing } from './mock-data.js';

export function createMockApp(): express.Application {
  const app = express();
  app.use(express.json());

  // CORS - allow frontend on any origin (Vercel, localhost, etc.)
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  // GET /api/listings - Browse with pagination and sorting
  app.get('/api/listings', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 50));
    const sortBy = (req.query.sortBy as string) || 'dateAdded';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const sorted = sortListings(MOCK_LISTINGS, sortBy, sortOrder);
    const totalCount = sorted.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;
    const pageListings = sorted.slice(offset, offset + pageSize);

    res.json({
      listings: pageListings.map(toSummary),
      totalCount,
      page,
      pageSize,
      totalPages,
    });
  });

  // GET /api/listings/:id - Detail view
  app.get('/api/listings/:id', (req, res) => {
    const listing = MOCK_LISTINGS.find(l => l.id === req.params.id);
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    res.json(listing);
  });

  // POST /api/listings/filter - Filter listings
  app.post('/api/listings/filter', (req, res) => {
    const criteria = req.body;
    let filtered = [...MOCK_LISTINGS];

    if (criteria.horsepowerMin != null) {
      filtered = filtered.filter(l => l.horsepower != null && l.horsepower >= criteria.horsepowerMin);
    }
    if (criteria.horsepowerMax != null) {
      filtered = filtered.filter(l => l.horsepower != null && l.horsepower <= criteria.horsepowerMax);
    }
    if (criteria.priceMin != null) {
      filtered = filtered.filter(l => l.price >= criteria.priceMin);
    }
    if (criteria.priceMax != null) {
      filtered = filtered.filter(l => l.price <= criteria.priceMax);
    }
    if (criteria.yearMin != null) {
      filtered = filtered.filter(l => l.year >= criteria.yearMin);
    }
    if (criteria.yearMax != null) {
      filtered = filtered.filter(l => l.year <= criteria.yearMax);
    }
    if (criteria.engineDisplacementMin != null) {
      filtered = filtered.filter(l => l.engineDisplacementCc != null && l.engineDisplacementCc >= criteria.engineDisplacementMin);
    }
    if (criteria.engineDisplacementMax != null) {
      filtered = filtered.filter(l => l.engineDisplacementCc != null && l.engineDisplacementCc <= criteria.engineDisplacementMax);
    }
    if (criteria.transmissionType?.length) {
      filtered = filtered.filter(l => l.transmissionType && criteria.transmissionType.includes(l.transmissionType));
    }
    if (criteria.fuelType?.length) {
      filtered = filtered.filter(l => l.fuelType && criteria.fuelType.includes(l.fuelType));
    }
    if (criteria.soundProfile) {
      const sp = criteria.soundProfile;
      if (sp.engineConfiguration?.length) {
        filtered = filtered.filter(l => l.soundProfile && sp.engineConfiguration.includes(l.soundProfile.engineConfiguration));
      }
      if (sp.cylinderCount?.length) {
        filtered = filtered.filter(l => l.soundProfile && sp.cylinderCount.includes(l.soundProfile.cylinderCount));
      }
      if (sp.forcedInduction?.length) {
        filtered = filtered.filter(l => l.soundProfile && sp.forcedInduction.includes(l.soundProfile.forcedInduction));
      }
      if (sp.exhaustNote?.length) {
        filtered = filtered.filter(l => l.soundProfile && sp.exhaustNote.includes(l.soundProfile.exhaustNote));
      }
    }

    const sortBy = criteria.sortBy || 'dateAdded';
    const sortOrder = criteria.sortOrder || 'desc';
    const sorted = sortListings(filtered, sortBy, sortOrder);

    const page = criteria.page || 1;
    const pageSize = criteria.pageSize || 50;
    const totalCount = sorted.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    res.json({
      listings: sorted.slice(offset, offset + pageSize).map(toSummary),
      totalCount,
      page,
      pageSize,
      totalPages,
    });
  });

  // GET /api/search - Text search
  app.get('/api/search', (req, res) => {
    const q = ((req.query.q as string) || '').trim().toLowerCase();

    if (q.length < 2) {
      res.json({ listings: [], totalCount: 0, expandedQuery: null, suggestions: [] });
      return;
    }

    // Simple abbreviation expansion
    const abbreviations: Record<string, string> = {
      merc: 'mercedes-benz', mercedes: 'mercedes-benz', chevy: 'chevrolet',
      lambo: 'lamborghini', beemer: 'bmw', bimmer: 'bmw', aston: 'aston martin',
    };
    const expanded = abbreviations[q] || q;
    const wasExpanded = expanded !== q;

    const results = MOCK_LISTINGS.filter(l =>
      l.make.toLowerCase().includes(expanded) ||
      l.model.toLowerCase().includes(expanded) ||
      l.title.toLowerCase().includes(expanded)
    );

    const suggestions = results.length === 0
      ? [...new Set(MOCK_LISTINGS.map(l => l.make))].slice(0, 5)
      : [];

    res.json({
      listings: results.map(toSummary),
      totalCount: results.length,
      expandedQuery: wasExpanded ? expanded : null,
      suggestions,
    });
  });

  // GET /api/marketplace-health
  app.get('/api/marketplace-health', (_req, res) => {
    res.json({
      marketplaces: [
        { marketplace: 'autotrack', status: 'healthy', lastSuccessfulContact: new Date().toISOString(), consecutiveFailures: 0, unreachableSince: null },
        { marketplace: 'autoscout24', status: 'healthy', lastSuccessfulContact: new Date().toISOString(), consecutiveFailures: 0, unreachableSince: null },
        { marketplace: 'marktplaats', status: 'healthy', lastSuccessfulContact: new Date().toISOString(), consecutiveFailures: 0, unreachableSince: null },
      ],
    });
  });

  // GET /api/filter-options
  app.get('/api/filter-options', (_req, res) => {
    const makes = [...new Set(MOCK_LISTINGS.map(l => l.make))].sort();
    const models = [...new Set(MOCK_LISTINGS.map(l => l.model))].sort();
    res.json({
      makes,
      models,
      fuelTypes: ['petrol', 'diesel', 'hybrid', 'electric'],
      transmissionTypes: ['manual', 'automatic'],
      ranges: {
        price: { min: Math.min(...MOCK_LISTINGS.map(l => l.price)), max: Math.max(...MOCK_LISTINGS.map(l => l.price)) },
        horsepower: { min: Math.min(...MOCK_LISTINGS.filter(l => l.horsepower).map(l => l.horsepower!)), max: Math.max(...MOCK_LISTINGS.filter(l => l.horsepower).map(l => l.horsepower!)) },
        engineDisplacement: { min: Math.min(...MOCK_LISTINGS.filter(l => l.engineDisplacementCc).map(l => l.engineDisplacementCc!)), max: Math.max(...MOCK_LISTINGS.filter(l => l.engineDisplacementCc).map(l => l.engineDisplacementCc!)) },
        year: { min: Math.min(...MOCK_LISTINGS.map(l => l.year)), max: Math.max(...MOCK_LISTINGS.map(l => l.year)) },
      },
    });
  });

  // GET /api/sound-profiles/:id/audio
  app.get('/api/sound-profiles/:id/audio', (_req, res) => {
    res.status(404).json({ error: 'Audio clip not available in mock mode' });
  });

  return app;
}

function toSummary(l: MockListing) {
  return {
    id: l.id,
    title: l.title,
    primaryImageUrl: l.imageUrls[0] || null,
    make: l.make,
    model: l.model,
    year: l.year,
    price: l.price,
    horsepower: l.horsepower,
    engineDisplacementCc: l.engineDisplacementCc,
    dateAdded: l.dateAdded,
  };
}

function sortListings(listings: MockListing[], sortBy: string, sortOrder: string): MockListing[] {
  const sorted = [...listings];
  const dir = sortOrder === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    let aVal: number, bVal: number;
    switch (sortBy) {
      case 'price': aVal = a.price; bVal = b.price; break;
      case 'horsepower': aVal = a.horsepower ?? 0; bVal = b.horsepower ?? 0; break;
      case 'engineDisplacement': aVal = a.engineDisplacementCc ?? 0; bVal = b.engineDisplacementCc ?? 0; break;
      case 'year': aVal = a.year; bVal = b.year; break;
      case 'dateAdded':
      default:
        aVal = new Date(a.dateAdded).getTime(); bVal = new Date(b.dateAdded).getTime(); break;
    }
    return (aVal - bVal) * dir;
  });

  return sorted;
}
