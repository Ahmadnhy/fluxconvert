import { render, screen, waitFor } from '@testing-library/react';
import WordToPdfConverter from '../WordToPdfConverter';
import { createClient } from '@/src/lib/supabase/client';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock Supabase client
jest.mock('@/src/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock UserProfile component
jest.mock('@/src/components/UserProfile', () => {
  return function MockUserProfile({ userEmail }: { userEmail: string }) {
    return <div data-testid="user-profile">{userEmail}</div>;
  };
});

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'dropzone-input' }),
    isDragActive: false,
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('WordToPdfConverter Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { email: 'test@example.com' } },
          }),
        },
      };
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    it('should render Dashboard link in navigation', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      });
    });

    it('should render Word to PDF link in navigation', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const wordToPdfLink = screen.getByRole('link', { name: /word to pdf/i });
        expect(wordToPdfLink).toBeInTheDocument();
        expect(wordToPdfLink).toHaveAttribute('href', '/word-to-pdf');
      });
    });

    it('should render Privacy link in navigation', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const privacyLinks = screen.getAllByRole('link', { name: /privacy/i });
        expect(privacyLinks.length).toBeGreaterThan(0);
        expect(privacyLinks[0]).toHaveAttribute('href', '/privacy');
      });
    });

    it('should render Terms link in navigation', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const termsLinks = screen.getAllByRole('link', { name: /terms/i });
        expect(termsLinks.length).toBeGreaterThan(0);
        expect(termsLinks[0]).toHaveAttribute('href', '/terms');
      });
    });

    it('should render Help Center link in navigation', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const helpLinks = screen.getAllByRole('link', { name: /help center/i });
        expect(helpLinks.length).toBeGreaterThan(0);
        expect(helpLinks[0]).toHaveAttribute('href', '/help-center');
      });
    });

    it('should display user profile when authenticated', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const userProfile = screen.getByTestId('user-profile');
        expect(userProfile).toBeInTheDocument();
        expect(userProfile).toHaveTextContent('test@example.com');
      });
    });

    it('should not display Login and Sign Up buttons when authenticated', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    it('should render all navigation links', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /word to pdf/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /privacy/i })[0]).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /terms/i })[0]).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /help center/i })[0]).toBeInTheDocument();
      });
    });

    it('should display Login and Sign Up buttons when not authenticated', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const loginLink = screen.getByRole('link', { name: /^login$/i });
        const signUpLink = screen.getByRole('link', { name: /sign up/i });
        
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
        
        expect(signUpLink).toBeInTheDocument();
        expect(signUpLink).toHaveAttribute('href', '/register');
      });
    });

    it('should not display user profile when not authenticated', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        expect(screen.queryByTestId('user-profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('navigation structure', () => {
    beforeEach(() => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      };
      (createClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    it('should render FluxConvert logo/brand link', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const brandLink = screen.getByRole('link', { name: /fluxconvert/i });
        expect(brandLink).toBeInTheDocument();
        expect(brandLink).toHaveAttribute('href', '/');
      });
    });

    it('should have navigation element', async () => {
      render(<WordToPdfConverter />);

      await waitFor(() => {
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
      });
    });
  });
});
