import { render, screen } from '@testing-library/react';
import PrivacyPage, { metadata } from '../page';

// Mock the PrivacyPolicy component
jest.mock('@/src/components/pages/PrivacyPolicy', () => {
  return function MockPrivacyPolicy() {
    return <div data-testid="privacy-policy">Privacy Policy Content</div>;
  };
});

describe('Privacy Page', () => {
  it('should render the PrivacyPolicy component', () => {
    render(<PrivacyPage />);
    expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
  });

  it('should have correct SEO metadata', () => {
    expect(metadata.title).toBe('Privacy Policy - FluxConvert');
    expect(metadata.description).toBe('FluxConvert privacy policy and data protection information');
  });
});
