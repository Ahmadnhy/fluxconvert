import { render, screen } from '@testing-library/react';
import RegisterPage from '../page';

// Mock the RegisterForm component
jest.mock('@/src/components/auth/RegisterForm', () => {
  return function MockRegisterForm() {
    return <div data-testid="register-form">Register Form</div>;
  };
});

describe('Register Page', () => {
  it('should render the RegisterForm component', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('register-form')).toBeInTheDocument();
  });

  it('should have a footer with links to Privacy, Terms, and Help Center', () => {
    render(<RegisterPage />);
    
    // Check for footer links
    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    const termsLink = screen.getByRole('link', { name: /terms of service/i });
    const helpLink = screen.getByRole('link', { name: /help center/i });
    
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms');
    
    expect(helpLink).toBeInTheDocument();
    expect(helpLink).toHaveAttribute('href', '/help-center');
  });

  it('should display copyright information in footer', () => {
    render(<RegisterPage />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} FluxConvert`, 'i'))).toBeInTheDocument();
  });
});
