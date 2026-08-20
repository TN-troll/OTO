import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from './TabBar';

const mockUseLanguage = vi.fn();
vi.mock('../i18n', () => ({
  useLanguage: () => mockUseLanguage(),
}));

const enTranslations = { tabListings: 'Listings', tabMap: 'Map' };
const nlTranslations = { tabListings: 'Overzicht', tabMap: 'Kaart' };

describe('TabBar', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({ t: enTranslations, locale: 'en' });
  });

  it('renders a tablist with two tabs', () => {
    render(<TabBar activeTab="listings" onTabChange={() => {}} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('renders i18n labels in English', () => {
    render(<TabBar activeTab="listings" onTabChange={() => {}} />);

    expect(screen.getByText('Listings')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
  });

  it('renders i18n labels in Dutch', () => {
    mockUseLanguage.mockReturnValue({ t: nlTranslations, locale: 'nl' });
    render(<TabBar activeTab="listings" onTabChange={() => {}} />);

    expect(screen.getByText('Overzicht')).toBeInTheDocument();
    expect(screen.getByText('Kaart')).toBeInTheDocument();
  });

  it('marks listings tab as active with aria-selected=true', () => {
    render(<TabBar activeTab="listings" onTabChange={() => {}} />);

    const listingsTab = screen.getByText('Listings');
    const mapTab = screen.getByText('Map');

    expect(listingsTab).toHaveAttribute('aria-selected', 'true');
    expect(listingsTab).toHaveAttribute('tabindex', '0');
    expect(mapTab).toHaveAttribute('aria-selected', 'false');
    expect(mapTab).toHaveAttribute('tabindex', '-1');
  });

  it('marks map tab as active with aria-selected=true', () => {
    render(<TabBar activeTab="map" onTabChange={() => {}} />);

    const listingsTab = screen.getByText('Listings');
    const mapTab = screen.getByText('Map');

    expect(mapTab).toHaveAttribute('aria-selected', 'true');
    expect(mapTab).toHaveAttribute('tabindex', '0');
    expect(listingsTab).toHaveAttribute('aria-selected', 'false');
    expect(listingsTab).toHaveAttribute('tabindex', '-1');
  });

  it('calls onTabChange with "map" when map tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<TabBar activeTab="listings" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText('Map'));

    expect(onTabChange).toHaveBeenCalledWith('map');
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  it('calls onTabChange with "listings" when listings tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<TabBar activeTab="map" onTabChange={onTabChange} />);

    fireEvent.click(screen.getByText('Listings'));

    expect(onTabChange).toHaveBeenCalledWith('listings');
    expect(onTabChange).toHaveBeenCalledTimes(1);
  });

  it('applies glass styling classes to the active tab', () => {
    render(<TabBar activeTab="listings" onTabChange={() => {}} />);

    const listingsTab = screen.getByText('Listings');
    expect(listingsTab.className).toContain('backdrop-blur-lg');
    expect(listingsTab.className).toContain('bg-white/20');
  });

  it('has backdrop-blur on the container for frosted glass effect', () => {
    render(<TabBar activeTab="listings" onTabChange={() => {}} />);

    const tablist = screen.getByRole('tablist');
    expect(tablist.className).toContain('backdrop-blur-lg');
    expect(tablist.className).toContain('border-white/20');
  });

  describe('aria-controls', () => {
    it('sets aria-controls on listings tab referencing tabpanel-listings', () => {
      render(<TabBar activeTab="listings" onTabChange={() => {}} />);

      const listingsTab = screen.getByText('Listings');
      expect(listingsTab).toHaveAttribute('aria-controls', 'tabpanel-listings');
    });

    it('sets aria-controls on map tab referencing tabpanel-map', () => {
      render(<TabBar activeTab="listings" onTabChange={() => {}} />);

      const mapTab = screen.getByText('Map');
      expect(mapTab).toHaveAttribute('aria-controls', 'tabpanel-map');
    });

    it('sets id on each tab button for aria-labelledby references', () => {
      render(<TabBar activeTab="listings" onTabChange={() => {}} />);

      const listingsTab = screen.getByText('Listings');
      const mapTab = screen.getByText('Map');

      expect(listingsTab).toHaveAttribute('id', 'tab-listings');
      expect(mapTab).toHaveAttribute('id', 'tab-map');
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus to map tab on ArrowRight from listings tab', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="listings" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: 'ArrowRight' });

      expect(onTabChange).toHaveBeenCalledWith('map');
    });

    it('wraps focus to listings tab on ArrowRight from map tab', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="map" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: 'ArrowRight' });

      expect(onTabChange).toHaveBeenCalledWith('listings');
    });

    it('moves focus to map tab on ArrowLeft from listings tab (wraps)', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="listings" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: 'ArrowLeft' });

      expect(onTabChange).toHaveBeenCalledWith('map');
    });

    it('moves focus to listings tab on ArrowLeft from map tab', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="map" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: 'ArrowLeft' });

      expect(onTabChange).toHaveBeenCalledWith('listings');
    });

    it('moves focus to first tab on Home key', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="map" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: 'Home' });

      expect(onTabChange).toHaveBeenCalledWith('listings');
    });

    it('moves focus to last tab on End key', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="listings" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: 'End' });

      expect(onTabChange).toHaveBeenCalledWith('map');
    });

    it('activates tab on Enter key', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="listings" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: 'Enter' });

      expect(onTabChange).toHaveBeenCalledWith('listings');
    });

    it('activates tab on Space key', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="map" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: ' ' });

      expect(onTabChange).toHaveBeenCalledWith('map');
    });

    it('does not respond to unrelated keys', () => {
      const onTabChange = vi.fn();
      render(<TabBar activeTab="listings" onTabChange={onTabChange} />);

      const tablist = screen.getByRole('tablist');
      fireEvent.keyDown(tablist, { key: 'Tab' });
      fireEvent.keyDown(tablist, { key: 'a' });

      expect(onTabChange).not.toHaveBeenCalled();
    });
  });
});
