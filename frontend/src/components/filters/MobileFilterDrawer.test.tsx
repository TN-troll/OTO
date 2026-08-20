import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileFilterDrawer } from './MobileFilterDrawer';

// Mock useFilterContext
const mockSetMobileFilterOpen = vi.fn();
let mockMobileFilterOpen = false;
let mockFilterResult: { totalCount: number } | undefined = { totalCount: 42 };

vi.mock('../../hooks/FilterContext', () => ({
  useFilterContext: () => ({
    mobileFilterOpen: mockMobileFilterOpen,
    setMobileFilterOpen: mockSetMobileFilterOpen,
    filterResult: mockFilterResult,
  }),
}));

// Mock useLanguage
vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'en',
    t: { showResults: 'Show results' },
    setLocale: vi.fn(),
  }),
}));

describe('MobileFilterDrawer', () => {
  beforeEach(() => {
    mockMobileFilterOpen = false;
    mockFilterResult = { totalCount: 42 };
    mockSetMobileFilterOpen.mockClear();
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders children inside the drawer', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Filter content</div>
      </MobileFilterDrawer>
    );
    expect(screen.getByText('Filter content')).toBeInTheDocument();
  });

  it('renders as a dialog with aria-modal', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Filters');
  });

  it('displays "Show results" button with total count', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    expect(screen.getByText('Show results (42)')).toBeInTheDocument();
  });

  it('shows 0 count when filterResult is undefined', () => {
    mockMobileFilterOpen = true;
    mockFilterResult = undefined;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    expect(screen.getByText('Show results (0)')).toBeInTheDocument();
  });

  it('calls setMobileFilterOpen(false) when close button is clicked', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const closeBtn = screen.getByLabelText('Close filters');
    fireEvent.click(closeBtn);
    expect(mockSetMobileFilterOpen).toHaveBeenCalledWith(false);
  });

  it('calls setMobileFilterOpen(false) when "Show results" is clicked', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const showBtn = screen.getByText('Show results (42)');
    fireEvent.click(showBtn);
    expect(mockSetMobileFilterOpen).toHaveBeenCalledWith(false);
  });

  it('applies translate-y-0 when open', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('translate-y-0');
    expect(dialog.className).not.toContain('translate-y-full');
  });

  it('applies translate-y-full when closed', () => {
    mockMobileFilterOpen = false;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('translate-y-full');
    expect(dialog.className).not.toContain('translate-y-0');
  });

  it('uses spring animation timing (ease-smooth)', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('ease-smooth');
  });

  it('locks body scroll when drawer is open', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when drawer is closed', () => {
    mockMobileFilterOpen = false;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('closes drawer on swipe-down with sufficient distance', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const dialog = screen.getByRole('dialog');

    // Simulate swipe down > 100px
    fireEvent.touchStart(dialog, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(dialog, { touches: [{ clientY: 250 }] });
    fireEvent.touchEnd(dialog);

    expect(mockSetMobileFilterOpen).toHaveBeenCalledWith(false);
  });

  it('does not close on small swipe-down', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const dialog = screen.getByRole('dialog');

    // Simulate small swipe (< 100px and low velocity)
    fireEvent.touchStart(dialog, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(dialog, { touches: [{ clientY: 130 }] });
    fireEvent.touchEnd(dialog);

    expect(mockSetMobileFilterOpen).not.toHaveBeenCalled();
  });

  it('closes drawer when backdrop is clicked', () => {
    mockMobileFilterOpen = true;
    const { container } = render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    // The backdrop is the first child div (aria-hidden)
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(mockSetMobileFilterOpen).toHaveBeenCalledWith(false);
  });

  it('close button meets minimum touch target of 44px', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const closeBtn = screen.getByLabelText('Close filters');
    expect(closeBtn.className).toContain('min-h-touch');
    expect(closeBtn.className).toContain('min-w-touch');
  });

  it('uses glass morphism backdrop blur', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('backdrop-blur-glass');
    expect(dialog.className).toContain('bg-glass-light');
  });

  it('has a scrollable content area', () => {
    mockMobileFilterOpen = true;
    render(
      <MobileFilterDrawer>
        <div>Content</div>
      </MobileFilterDrawer>
    );
    const dialog = screen.getByRole('dialog');
    const scrollableArea = dialog.querySelector('.overflow-y-auto');
    expect(scrollableArea).toBeInTheDocument();
  });
});
