import { render, screen } from '@testing-library/react';
import LoginPage from '../page';

// Mock the LoginForm component
jest.mock('@/src/components/auth/LoginForm', () => {
  return function MockLoginForm() {
    return <div data-testid="login-form">Login Form</div>;
  };
});

describe('Login Page', () => {
  it('should render the LoginForm component', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('should have a footer with links to Privacy, Terms, and Help Center', () => {
    render(<LoginPage />);
    
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
    render(<LoginPage />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} FluxConvert`, 'i'))).toBeInTheDocument();
  });
});
