import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InteractiveMap } from './InteractiveMap';

// Mock react-leaflet components
vi.mock('react-leaflet', () => {
  const MapContainer = ({
    children,
    center,
    zoom,
    scrollWheelZoom,
    className,
    keyboard,
  }: {
    children: React.ReactNode;
    center: [number, number];
    zoom: number;
    scrollWheelZoom: boolean;
    className: string;
    keyboard: boolean;
  }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      data-scroll-wheel-zoom={String(scrollWheelZoom)}
      data-keyboard={String(keyboard)}
      className={className}
    >
      {children}
    </div>
  );

  const TileLayer = ({ attribution, url }: { attribution: string; url: string }) => (
    <div data-testid="tile-layer" data-attribution={attribution} data-url={url} />
  );

  const useMap = () => ({
    scrollWheelZoom: {
      disable: vi.fn(),
      enable: vi.fn(),
    },
  });

  return { MapContainer, TileLayer, useMap };
});

describe('InteractiveMap', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders MapContainer centered on the Netherlands (52.2, 5.3) at zoom 7', () => {
    render(<InteractiveMap />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer.dataset.center).toBe(JSON.stringify([52.2, 5.3]));
    expect(mapContainer.dataset.zoom).toBe('7');
  });

  it('renders OpenStreetMap TileLayer with proper attribution', () => {
    render(<InteractiveMap />);
    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer.dataset.attribution).toContain('OpenStreetMap');
    expect(tileLayer.dataset.url).toBe(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    );
  });

  it('sets responsive height with min-height 400px', () => {
    const { container } = render(<InteractiveMap />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.minHeight).toBe('400px');
    expect(wrapper.style.height).toContain('calc');
  });

  it('enables scroll zoom on desktop viewport (>= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<InteractiveMap />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer.dataset.scrollWheelZoom).toBe('true');
  });

  it('disables scroll zoom on mobile viewport (< 768px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
    matchMediaMock.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<InteractiveMap />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer.dataset.scrollWheelZoom).toBe('false');
  });

  it('enables keyboard interactions', () => {
    render(<InteractiveMap />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer.dataset.keyboard).toBe('true');
  });

  it('renders children inside the map container', () => {
    render(
      <InteractiveMap>
        <div data-testid="child-marker">Test Marker</div>
      </InteractiveMap>
    );
    expect(screen.getByTestId('child-marker')).toBeInTheDocument();
  });

  it('accepts locations prop without error', () => {
    const mockLocations = [
      {
        city: 'Amsterdam',
        latitude: 52.3676,
        longitude: 4.9041,
        totalCount: 10,
        dealerCount: 7,
        privateCount: 3,
        previews: [],
      },
    ];

    expect(() => render(<InteractiveMap locations={mockLocations} />)).not.toThrow();
  });
});
