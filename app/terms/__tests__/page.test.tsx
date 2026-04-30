import { render, screen } from '@testing-library/react';
import TermsPage, { metadata } from '../page';

// Mock the TermsOfService component
jest.mock('@/src/components/pages/TermsOfService', () => {
  return function MockTermsOfService() {
    return (
      <div data-testid="terms-of-service">
        <h1>Terms of Service</h1>
        <p>Terms of Service content</p>
      </div>
    );
  };
});

describe('TermsPage', () => {
  it('should render the TermsOfService component', () => {
    render(<TermsPage />);
    expect(screen.getByTestId('terms-of-service')).toBeInTheDocument();
  });

  it('should have correct metadata', () => {
    expect(metadata.title).toBe('Terms of Service - FluxConvert');
    expect(metadata.description).toBe('FluxConvert terms of service and user agreement');
  });

  it('should display Terms of Service heading', () => {
    render(<TermsPage />);
    expect(screen.getByRole('heading', { name: /terms of service/i })).toBeInTheDocument();
  });
});
