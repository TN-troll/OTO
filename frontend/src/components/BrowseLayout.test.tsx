import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapLoadingSkeleton, MapErrorFallback, MapErrorBoundary } from './BrowseLayout';

const mockUseLanguage = vi.fn();
vi.mock('../i18n', () => ({
  useLanguage: () => mockUseLanguage(),
}));

const enTranslations = {
  loadingMap: 'Loading map...',
  mapLoadError: 'Could not load map',
  retry: 'Retry',
};
const nlTranslations = {
  loadingMap: 'Kaart laden...',
  mapLoadError: 'Kaart kon niet worden geladen',
  retry: 'Opnieuw',
};

describe('MapLoadingSkeleton', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({ t: enTranslations, locale: 'en' });
  });

  it('renders localized loading text in English', () => {
    render(<MapLoadingSkeleton />);
    expect(screen.getByText('Loading map...')).toBeInTheDocument();
  });

  it('renders localized loading text in Dutch', () => {
    mockUseLanguage.mockReturnValue({ t: nlTranslations, locale: 'nl' });
    render(<MapLoadingSkeleton />);
    expect(screen.getByText('Kaart laden...')).toBeInTheDocument();
  });

  it('applies Apple Glass shimmer animation', () => {
    const { container } = render(<MapLoadingSkeleton />);
    const shimmerEl = container.querySelector('[class*="animate-shimmer"]');
    expect(shimmerEl).not.toBeNull();
  });

  it('applies frosted glass styling with backdrop-blur', () => {
    const { container } = render(<MapLoadingSkeleton />);
    const glassEl = container.querySelector('[class*="backdrop-blur"]');
    expect(glassEl).not.toBeNull();
  });

  it('includes motion-reduce:animate-none for accessibility', () => {
    const { container } = render(<MapLoadingSkeleton />);
    const shimmerEl = container.querySelector('[class*="animate-shimmer"]');
    expect(shimmerEl!.className).toContain('motion-reduce:animate-none');
  });

  it('renders map placeholder elements', () => {
    const { container } = render(<MapLoadingSkeleton />);
    // The skeleton has placeholder rectangles simulating a map area
    const placeholders = container.querySelectorAll('[class*="rounded-xl"][class*="bg-surface"]');
    expect(placeholders.length).toBeGreaterThan(0);
  });
});

describe('MapErrorFallback', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({ t: enTranslations, locale: 'en' });
  });

  it('renders localized error message in English', () => {
    render(<MapErrorFallback onRetry={() => {}} />);
    expect(screen.getByText('Could not load map')).toBeInTheDocument();
  });

  it('renders localized error message in Dutch', () => {
    mockUseLanguage.mockReturnValue({ t: nlTranslations, locale: 'nl' });
    render(<MapErrorFallback onRetry={() => {}} />);
    expect(screen.getByText('Kaart kon niet worden geladen')).toBeInTheDocument();
  });

  it('renders a retry button', () => {
    render(<MapErrorFallback onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<MapErrorFallback onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('applies glass-styled overlay (backdrop-blur-lg)', () => {
    const { container } = render(<MapErrorFallback onRetry={() => {}} />);
    const glassPanel = container.querySelector('[class*="backdrop-blur-lg"]');
    expect(glassPanel).not.toBeNull();
  });

  it('applies semi-transparent background', () => {
    const { container } = render(<MapErrorFallback onRetry={() => {}} />);
    const glassPanel = container.querySelector('[class*="bg-white/10"]');
    expect(glassPanel).not.toBeNull();
  });

  it('renders retry button in Dutch locale', () => {
    mockUseLanguage.mockReturnValue({ t: nlTranslations, locale: 'nl' });
    render(<MapErrorFallback onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: 'Opnieuw' })).toBeInTheDocument();
  });
});

describe('MapErrorBoundary', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({ t: enTranslations, locale: 'en' });
    // Suppress React error boundary console errors during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <MapErrorBoundary>
        <div>Map Content</div>
      </MapErrorBoundary>
    );
    expect(screen.getByText('Map Content')).toBeInTheDocument();
  });

  it('renders MapErrorFallback when child throws', () => {
    function ThrowingComponent(): JSX.Element {
      throw new Error('chunk load failed');
    }

    render(
      <MapErrorBoundary>
        <ThrowingComponent />
      </MapErrorBoundary>
    );

    expect(screen.getByText('Could not load map')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('resets error state and re-renders children on retry click', () => {
    let shouldThrow = true;

    function ConditionalComponent(): JSX.Element {
      if (shouldThrow) {
        throw new Error('chunk load failed');
      }
      return <div>Map Loaded</div>;
    }

    const { rerender } = render(
      <MapErrorBoundary>
        <ConditionalComponent />
      </MapErrorBoundary>
    );

    // Error fallback is shown
    expect(screen.getByText('Could not load map')).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    // After retry, children should re-render successfully
    expect(screen.getByText('Map Loaded')).toBeInTheDocument();
  });

  it('allows unlimited retries (retry button always available after error)', () => {
    let shouldThrow = true;

    function ConditionalThrowComponent(): JSX.Element {
      if (shouldThrow) {
        throw new Error('chunk load failed');
      }
      return <div>Finally Loaded</div>;
    }

    render(
      <MapErrorBoundary>
        <ConditionalThrowComponent />
      </MapErrorBoundary>
    );

    // First error — retry button available
    expect(screen.getByText('Could not load map')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

    // Click retry — still throws, retry button still available
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText('Could not load map')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

    // Fix the error condition and retry one more time
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    // Now it succeeds
    expect(screen.getByText('Finally Loaded')).toBeInTheDocument();
  });
});
