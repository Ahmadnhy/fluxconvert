import { render, screen, waitFor } from '@testing-library/react';
import Home from '../home';
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

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hero Section and Tool Grid', () => {
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

    it('should not render file drop zone', async () => {
      render(<Home />);

      await waitFor(() => {
        // Verify no file input elements exist
        expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/drag.*drop/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/choose.*file/i)).not.toBeInTheDocument();
        
        // Verify no file input element
        const fileInputs = document.querySelectorAll('input[type="file"]');
        expect(fileInputs.length).toBe(0);
      });
    });

    it('should display welcome message in hero section', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText(/welcome to fluxconvert/i)).toBeInTheDocument();
        expect(screen.getByText(/professional-grade tools/i)).toBeInTheDocument();
      });
    });

    it('should display tool grid with conversion tools', async () => {
      render(<Home />);

      await waitFor(() => {
        // Verify "Popular Tools" heading
        expect(screen.getByText(/popular tools/i)).toBeInTheDocument();
        
        // Verify all 6 tool cards are present
        expect(screen.getByText('PDF to Word')).toBeInTheDocument();
        expect(screen.getByText('Word to PDF')).toBeInTheDocument();
        expect(screen.getByText('JPG to PDF')).toBeInTheDocument();
        expect(screen.getByText('PNG to PDF')).toBeInTheDocument();
        expect(screen.getByText('Merge PDF')).toBeInTheDocument();
        expect(screen.getByText('Split PDF')).toBeInTheDocument();
      });
    });

    it('should display tool descriptions in grid', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText(/easily convert your pdf files into editable word documents/i)).toBeInTheDocument();
        expect(screen.getByText(/convert doc and docx files into universally readable pdfs/i)).toBeInTheDocument();
        expect(screen.getByText(/combine multiple jpg images into a single pdf document/i)).toBeInTheDocument();
      });
    });

    it('should have navigation links for conversion tools', async () => {
      render(<Home />);

      await waitFor(() => {
        // Word to PDF should link to /word-to-pdf
        const wordToPdfLinks = screen.getAllByRole('link').filter(
          link => link.textContent?.includes('Word to PDF')
        );
        expect(wordToPdfLinks.length).toBeGreaterThan(0);
        expect(wordToPdfLinks[0]).toHaveAttribute('href', '/word-to-pdf');
        
        // Other tools should have placeholder links (#)
        const pdfToWordLinks = screen.getAllByRole('link').filter(
          link => link.textContent?.includes('PDF to Word')
        );
        expect(pdfToWordLinks.length).toBeGreaterThan(0);
        expect(pdfToWordLinks[0]).toHaveAttribute('href', '#');
      });
    });

    it('should display tool grid in proper layout', async () => {
      render(<Home />);

      await waitFor(() => {
        // Find all links within the tool grid section
        const allLinks = screen.getAllByRole('link');
        
        // Filter for tool card links (those that contain tool names)
        const toolNames = ['PDF to Word', 'Word to PDF', 'JPG to PDF', 'PNG to PDF', 'Merge PDF', 'Split PDF'];
        const toolCardLinks = allLinks.filter(link => 
          toolNames.some(name => link.textContent?.includes(name))
        );
        
        // Should have 6 tool cards
        expect(toolCardLinks.length).toBe(6);
      });
    });
  });

  describe('Navigation Component', () => {
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
        render(<Home />);

        await waitFor(() => {
          const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
          expect(dashboardLink).toBeInTheDocument();
          expect(dashboardLink).toHaveAttribute('href', '/dashboard');
        });
      });

      it('should render Privacy link in navigation', async () => {
        render(<Home />);

        await waitFor(() => {
          const privacyLinks = screen.getAllByRole('link', { name: /privacy/i });
          // Should appear in both nav and footer
          expect(privacyLinks.length).toBeGreaterThan(0);
          expect(privacyLinks[0]).toHaveAttribute('href', '/privacy');
        });
      });

      it('should render Terms link in navigation', async () => {
        render(<Home />);

        await waitFor(() => {
          const termsLinks = screen.getAllByRole('link', { name: /terms/i });
          // Should appear in both nav and footer
          expect(termsLinks.length).toBeGreaterThan(0);
          expect(termsLinks[0]).toHaveAttribute('href', '/terms');
        });
      });

      it('should render Help Center link in navigation', async () => {
        render(<Home />);

        await waitFor(() => {
          const helpLinks = screen.getAllByRole('link', { name: /help center/i });
          // Should appear in both nav and footer
          expect(helpLinks.length).toBeGreaterThan(0);
          expect(helpLinks[0]).toHaveAttribute('href', '/help-center');
        });
      });

      it('should display user profile when authenticated', async () => {
        render(<Home />);

        await waitFor(() => {
          const userProfile = screen.getByTestId('user-profile');
          expect(userProfile).toBeInTheDocument();
          expect(userProfile).toHaveTextContent('test@example.com');
        });
      });

      it('should not display Login and Sign Up buttons when authenticated', async () => {
        render(<Home />);

        await waitFor(() => {
          expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
          expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
        });
      });

      it('should render all required navigation links', async () => {
        render(<Home />);

        await waitFor(() => {
          expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
          expect(screen.getAllByRole('link', { name: /privacy/i })[0]).toBeInTheDocument();
          expect(screen.getAllByRole('link', { name: /terms/i })[0]).toBeInTheDocument();
          expect(screen.getAllByRole('link', { name: /help center/i })[0]).toBeInTheDocument();
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

      it('should render Dashboard link in navigation', async () => {
        render(<Home />);

        await waitFor(() => {
          const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
          expect(dashboardLink).toBeInTheDocument();
          expect(dashboardLink).toHaveAttribute('href', '/dashboard');
        });
      });

      it('should render static page links', async () => {
        render(<Home />);

        await waitFor(() => {
          expect(screen.getAllByRole('link', { name: /privacy/i })[0]).toBeInTheDocument();
          expect(screen.getAllByRole('link', { name: /terms/i })[0]).toBeInTheDocument();
          expect(screen.getAllByRole('link', { name: /help center/i })[0]).toBeInTheDocument();
        });
      });

      it('should display Login and Sign Up buttons when not authenticated', async () => {
        render(<Home />);

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
        render(<Home />);

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
        render(<Home />);

        await waitFor(() => {
          const brandLink = screen.getByRole('link', { name: /fluxconvert/i });
          expect(brandLink).toBeInTheDocument();
          expect(brandLink).toHaveAttribute('href', '/');
        });
      });

      it('should have navigation element', async () => {
        render(<Home />);

        await waitFor(() => {
          const nav = screen.getByRole('navigation');
          expect(nav).toBeInTheDocument();
        });
      });
    });
  });
});
