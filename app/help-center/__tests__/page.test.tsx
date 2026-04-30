import { render, screen } from '@testing-library/react';
import HelpCenterPage, { metadata } from '../page';

// Mock the HelpCenter component
jest.mock('@/src/components/pages/HelpCenter', () => {
  return function MockHelpCenter() {
    return (
      <div data-testid="help-center">
        <h1>How can we help?</h1>
        <p>Search our knowledge base or browse categories below to find answers to your questions.</p>
      </div>
    );
  };
});

describe('Help Center Page', () => {
  describe('Page Component', () => {
    it('should render the HelpCenter component', () => {
      render(<HelpCenterPage />);
      expect(screen.getByTestId('help-center')).toBeInTheDocument();
    });

    it('should display help center content', () => {
      render(<HelpCenterPage />);
      expect(screen.getByText(/how can we help/i)).toBeInTheDocument();
    });
  });

  describe('SEO Metadata', () => {
    it('should have proper title', () => {
      expect(metadata.title).toBe('Help Center - FluxConvert');
    });

    it('should have descriptive meta description', () => {
      expect(metadata.description).toContain('Get help with FluxConvert');
      expect(metadata.description).toContain('troubleshooting');
    });

    it('should have relevant keywords', () => {
      expect(metadata.keywords).toBeDefined();
      expect(metadata.keywords).toContain('help center');
      expect(metadata.keywords).toContain('support');
      expect(metadata.keywords).toContain('FAQ');
    });

    it('should have Open Graph metadata', () => {
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe('Help Center - FluxConvert');
      expect(metadata.openGraph?.description).toContain('Get help with FluxConvert');
      expect(metadata.openGraph?.type).toBe('website');
    });
  });
});
