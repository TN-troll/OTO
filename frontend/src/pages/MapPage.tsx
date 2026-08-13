import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

// Simple Dutch city coordinates (normalized 0-100 for SVG positioning)
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  'amsterdam': { x: 48, y: 35 },
  'rotterdam': { x: 43, y: 50 },
  'den haag': { x: 38, y: 47 },
  'utrecht': { x: 52, y: 42 },
  'eindhoven': { x: 53, y: 65 },
  'groningen': { x: 62, y: 12 },
  'tilburg': { x: 48, y: 60 },
  'almere': { x: 53, y: 32 },
  'breda': { x: 44, y: 62 },
  'nijmegen': { x: 60, y: 55 },
  'arnhem': { x: 60, y: 48 },
  'maastricht': { x: 58, y: 85 },
  'enschede': { x: 72, y: 38 },
  'haarlem': { x: 44, y: 33 },
  'amersfoort': { x: 54, y: 38 },
  'den bosch': { x: 52, y: 58 },
  'zwolle': { x: 60, y: 28 },
  'leiden': { x: 40, y: 42 },
  'leeuwarden': { x: 55, y: 10 },
  'apeldoorn': { x: 60, y: 38 },
  'woerden': { x: 47, y: 43 },
  'amstelveen': { x: 47, y: 37 },
};

export function MapPage() {
  useQuery({
    queryKey: ['listings', { page: 1, pageSize: 200, sortBy: 'price', sortOrder: 'desc' }],
    queryFn: () => api.getListings({ page: 1, pageSize: 200, sortBy: 'price', sortOrder: 'desc' }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-surface-600 transition-colors hover:text-brand-accent dark:text-surface-400">
        ← Back to listings
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-surface-900 dark:text-white">Map View</h1>
      <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">Listings by location across the Netherlands</p>
      
      <div className="mt-8 relative aspect-[3/4] max-w-md mx-auto rounded-2xl bg-surface-100 dark:bg-surface-800 overflow-hidden p-8">
        {/* Simple NL outline */}
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-20 absolute inset-0">
          <path d="M35 5 L70 5 L75 15 L72 25 L68 20 L65 30 L70 35 L65 40 L70 50 L65 55 L60 60 L62 70 L58 80 L55 90 L50 95 L45 90 L42 80 L38 70 L35 60 L30 55 L28 45 L32 40 L30 30 L35 20 Z" fill="currentColor" className="text-surface-400 dark:text-surface-600" />
        </svg>
        
        {/* City dots - show known cities */}
        {Object.entries(CITY_COORDS).slice(0, 12).map(([city, coords]) => (
          <div
            key={city}
            className="absolute group"
            style={{ left: `${coords.x}%`, top: `${coords.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="h-3 w-3 rounded-full bg-brand-accent shadow-glow transition-transform group-hover:scale-150" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block rounded bg-brand px-2 py-1 text-[10px] font-medium text-white whitespace-nowrap">
              {city.charAt(0).toUpperCase() + city.slice(1)}
            </div>
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-center text-xs text-surface-400 dark:text-surface-500">Hover over dots to see city names. Full interactive map coming soon.</p>
    </div>
  );
}
