import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DescriptionSection } from './ListingDetailPage';

// Mock the useLanguage hook to control locale in tests
const mockUseLanguage = vi.fn();
vi.mock('../i18n', () => ({
  useLanguage: () => mockUseLanguage(),
}));

// Mock react-router-dom, @tanstack/react-query etc. that ListingDetailPage imports
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '1' }),
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false, error: null }),
}));
vi.mock('../api/client', () => ({
  api: { get: vi.fn() },
}));
vi.mock('../hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({ addViewed: vi.fn() }),
}));
vi.mock('../hooks/useClickTracker', () => ({
  useClickTracker: () => ({ trackClick: vi.fn() }),
}));
vi.mock('../components/ListingCard', () => ({
  ListingCard: () => null,
}));
vi.mock('../components/FinanceCalculator', () => ({
  FinanceCalculator: () => null,
}));
vi.mock('../components/DealerContactForm', () => ({
  DealerContactForm: () => null,
}));
vi.mock('../utils/imageProxy', () => ({
  getProxyImageUrls: (urls: string[]) => urls,
}));

const enTranslations = {
  adDescription: 'Advertisement',
  backToListings: '← Back to listings',
};

const nlTranslations = {
  adDescription: 'Advertentietekst',
  backToListings: '← Terug naar overzicht',
};

describe('DescriptionSection', () => {
  describe('badge visibility per locale and translation state', () => {
    it('shows "Translated" badge when locale is "en" and valid translation exists', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      render(
        <DescriptionSection
          description="Dit is een mooie auto."
          descriptionEn="This is a beautiful car."
        />,
      );

      expect(screen.getByText(/Translated/)).toBeInTheDocument();
      expect(screen.queryByText(/Original \(NL\)/)).not.toBeInTheDocument();
    });

    it('shows "Original (NL)" badge when locale is "en" and no valid translation exists', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      render(
        <DescriptionSection
          description="Dit is een mooie auto."
          descriptionEn={null}
        />,
      );

      expect(screen.getByText(/Original \(NL\)/)).toBeInTheDocument();
      expect(screen.queryByText(/Translated/)).not.toBeInTheDocument();
    });

    it('shows "Original (NL)" badge when locale is "en" and descriptionEn is empty', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      render(
        <DescriptionSection
          description="Dit is een mooie auto."
          descriptionEn=""
        />,
      );

      expect(screen.getByText(/Original \(NL\)/)).toBeInTheDocument();
    });

    it('shows "Original (NL)" badge when locale is "en" and descriptionEn is literal "null"', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      render(
        <DescriptionSection
          description="Dit is een mooie auto."
          descriptionEn="null"
        />,
      );

      expect(screen.getByText(/Original \(NL\)/)).toBeInTheDocument();
    });

    it('does not render any badge element when locale is "nl"', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'nl',
        t: nlTranslations,
        setLocale: vi.fn(),
      });

      render(
        <DescriptionSection
          description="Dit is een mooie auto."
          descriptionEn="This is a beautiful car."
        />,
      );

      expect(screen.queryByText(/Translated/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Original \(NL\)/)).not.toBeInTheDocument();
    });
  });

  describe('aria-label presence on badges', () => {
    it('has aria-label on "Translated" badge describing translation status', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      render(
        <DescriptionSection
          description="Dit is een mooie auto."
          descriptionEn="This is a beautiful car."
        />,
      );

      const badge = screen.getByLabelText(
        'This description has been translated from Dutch to English',
      );
      expect(badge).toBeInTheDocument();
    });

    it('has aria-label on "Original (NL)" badge describing original language', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      render(
        <DescriptionSection
          description="Dit is een mooie auto."
          descriptionEn={null}
        />,
      );

      const badge = screen.getByLabelText(
        'This description is shown in the original Dutch language',
      );
      expect(badge).toBeInTheDocument();
    });
  });

  describe('sanitized HTML rendering', () => {
    it('renders safe HTML content via dangerouslySetInnerHTML', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      render(
        <DescriptionSection
          description="<p>Dutch text</p>"
          descriptionEn="<p>English <strong>bold</strong> text</p>"
        />,
      );

      // The sanitized HTML should render bold text
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText(/English/)).toBeInTheDocument();
    });

    it('strips dangerous script tags from rendered content', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      const { container } = render(
        <DescriptionSection
          description="<p>Safe content</p>"
          descriptionEn='<p>Hello</p><script>alert("xss")</script><p>World</p>'
        />,
      );

      // Script content should be removed — check the description content div specifically
      const descriptionDiv = container.querySelector('.mt-4');
      expect(descriptionDiv).not.toBeNull();
      expect(descriptionDiv!.innerHTML).not.toContain('<script');
      expect(descriptionDiv!.innerHTML).not.toContain('alert');
      // Safe content should remain
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('World')).toBeInTheDocument();
    });

    it('falls back to escaped original Dutch when sanitization produces empty output', () => {
      mockUseLanguage.mockReturnValue({
        locale: 'en',
        t: enTranslations,
        setLocale: vi.fn(),
      });

      // When descriptionEn only contains dangerous elements (gets stripped to empty),
      // it should fall back to showing the original Dutch as escaped plain text
      const { container } = render(
        <DescriptionSection
          description="<p>Original Dutch</p>"
          descriptionEn='<script>alert("xss")</script>'
        />,
      );

      // The EN translation is "null"-like after sanitization (script is removed),
      // but resolveTranslation sees it as valid (non-empty string).
      // The sanitizer then produces empty/whitespace output, triggering fallback.
      // Fallback renders original Dutch description as escaped plain text.
      expect(container.textContent).toContain('Original Dutch');
    });
  });
});
