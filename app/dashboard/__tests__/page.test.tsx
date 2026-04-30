import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Dashboard Page Unit Tests
 * 
 * Note: The dashboard page is a Next.js Server Component that uses async/await
 * and server-side authentication. Traditional React Testing Library tests cannot
 * render server components directly. These tests verify the component's source code
 * structure to ensure all required elements are present.
 * 
 * **Validates: Requirements 3.1, 3.6**
 */
describe('Dashboard Page', () => {
  let pageSource: string;

  beforeAll(() => {
    const dashboardPagePath = join(process.cwd(), 'app', 'dashboard', 'page.tsx');
    pageSource = readFileSync(dashboardPagePath, 'utf-8');
  });

  describe('Authentication and Redirect', () => {
    /**
     * **Validates: Requirement 3.6**
     * Verifies that unauthenticated users are redirected to the login page
     */
    it('should redirect unauthenticated users to login', () => {
      // Verify redirect logic exists
      expect(pageSource).toContain('redirect');
      expect(pageSource).toContain('/login');
      expect(pageSource).toContain('if (!user)');
    });

    it('should use Supabase auth to check user authentication', () => {
      // Verify Supabase client is used for authentication
      expect(pageSource).toContain('createClient');
      expect(pageSource).toContain('supabase.auth.getUser()');
    });

    it('should import redirect from next/navigation', () => {
      // Verify correct Next.js redirect import
      expect(pageSource).toContain("import { redirect } from 'next/navigation'");
    });
  });

  describe('Personalized Welcome Message', () => {
    /**
     * **Validates: Requirement 3.1**
     * Verifies that the dashboard displays a personalized welcome message
     */
    it('should display welcome message', () => {
      // Verify welcome heading exists
      expect(pageSource).toContain('Welcome back!');
    });

    it('should display user email in welcome section', () => {
      // Verify user email is displayed
      expect(pageSource).toContain('{user.email}');
    });

    it('should have welcome section with proper structure', () => {
      // Verify welcome section structure
      expect(pageSource).toMatch(/Welcome back!/);
      expect(pageSource).toMatch(/\{user\.email\}/);
    });

    it('should pass user email to UserProfile component', () => {
      // Verify UserProfile component receives user email
      expect(pageSource).toContain('UserProfile');
      expect(pageSource).toContain('userEmail={user.email');
    });
  });

  describe('Quick Action Cards', () => {
    /**
     * **Validates: Requirement 3.4**
     * Verifies that quick action cards for conversion tools are displayed
     */
    it('should contain Word to PDF quick action card', () => {
      // Verify Word to PDF card exists with proper structure
      expect(pageSource).toContain('href="/word-to-pdf"');
      expect(pageSource).toContain('Word to PDF');
      expect(pageSource).toContain('Convert Word documents to PDF');
    });

    it('should contain JPG to PDF quick action card', () => {
      // Verify JPG to PDF card exists
      expect(pageSource).toContain('href="/jpg-to-pdf"');
      expect(pageSource).toContain('JPG to PDF');
      expect(pageSource).toContain('Convert images to PDF');
    });

    it('should contain Merge PDF quick action card', () => {
      // Verify Merge PDF card exists
      expect(pageSource).toContain('href="/merge-pdf"');
      expect(pageSource).toContain('Merge PDF');
      expect(pageSource).toContain('Combine multiple PDFs');
    });

    it('should have quick action cards in a grid layout', () => {
      // Verify grid layout exists for quick actions
      expect(pageSource).toContain('grid grid-cols-1 md:grid-cols-3');
    });

    it('should have clickable card components with proper styling', () => {
      // Verify cards have hover effects and proper styling
      expect(pageSource).toContain('hover:shadow-md');
      expect(pageSource).toContain('transition-all');
      expect(pageSource).toContain('group');
    });

    it('should have icons for each quick action card', () => {
      // Verify SVG icons exist in cards
      expect(pageSource).toContain('<svg');
      expect(pageSource).toContain('viewBox="0 0 24 24"');
      
      // Verify multiple SVG icons (one for each card)
      const svgCount = (pageSource.match(/<svg/g) || []).length;
      expect(svgCount).toBeGreaterThanOrEqual(3);
    });

    it('should display quick action cards before conversion history', () => {
      // Verify quick actions grid appears before ConversionHistory component usage
      const quickActionsIndex = pageSource.indexOf('grid grid-cols-1 md:grid-cols-3');
      const conversionHistoryIndex = pageSource.indexOf('<ConversionHistory />');
      
      expect(quickActionsIndex).toBeGreaterThan(-1);
      expect(conversionHistoryIndex).toBeGreaterThan(-1);
      expect(quickActionsIndex).toBeLessThan(conversionHistoryIndex);
    });

    it('should have all three quick action cards with unique descriptions', () => {
      // Verify each card has unique content
      const descriptions = [
        'Convert Word documents to PDF',
        'Convert images to PDF',
        'Combine multiple PDFs'
      ];
      
      descriptions.forEach(description => {
        expect(pageSource).toContain(description);
      });
    });

    it('should use Link component for navigation', () => {
      // Verify Next.js Link component is used
      expect(pageSource).toContain("import Link from 'next/link'");
      expect(pageSource).toContain('<Link');
    });
  });

  describe('Navigation Structure', () => {
    it('should contain Dashboard link in navigation', () => {
      // Verify Dashboard link exists
      expect(pageSource).toContain('href="/dashboard"');
      expect(pageSource).toContain('Dashboard');
    });

    it('should contain Word to PDF link in navigation', () => {
      // Verify Word to PDF link exists
      expect(pageSource).toContain('href="/word-to-pdf"');
      expect(pageSource).toContain('Word to PDF');
    });

    it('should contain Privacy link in navigation', () => {
      // Verify Privacy link exists
      expect(pageSource).toContain('href="/privacy"');
      expect(pageSource).toContain('Privacy');
    });

    it('should contain Terms link in navigation', () => {
      // Verify Terms link exists
      expect(pageSource).toContain('href="/terms"');
      expect(pageSource).toContain('Terms');
    });

    it('should contain Help Center link in navigation', () => {
      // Verify Help Center link exists
      expect(pageSource).toContain('href="/help-center"');
      expect(pageSource).toContain('Help Center');
    });

    it('should contain FluxConvert brand link', () => {
      // Verify brand link exists
      expect(pageSource).toContain('href="/"');
      expect(pageSource).toContain('FluxConvert');
    });

    it('should contain navigation element', () => {
      // Verify nav element exists
      expect(pageSource).toContain('<nav');
    });
  });

  describe('Component Integration', () => {
    it('should integrate ConversionHistory component', () => {
      // Verify ConversionHistory component is imported and used
      expect(pageSource).toContain("import ConversionHistory from '@/src/components/dashboard/ConversionHistory'");
      expect(pageSource).toContain('<ConversionHistory />');
    });

    it('should integrate UserProfile component', () => {
      // Verify UserProfile component is imported and used
      expect(pageSource).toContain("import UserProfile from '@/src/components/UserProfile'");
      expect(pageSource).toContain('<UserProfile');
    });

    /**
     * **Validates: Requirements 9.1, 9.2, 9.4**
     * Verifies that the QuotaDisplay component is integrated into the dashboard
     */
    it('should integrate QuotaDisplay component', () => {
      // Verify QuotaDisplay component is imported and used
      expect(pageSource).toContain("import QuotaDisplay from '@/src/components/dashboard/QuotaDisplay'");
      expect(pageSource).toContain('<QuotaDisplay />');
    });

    it('should display QuotaDisplay before quick action cards', () => {
      // Verify QuotaDisplay appears before quick actions
      const quotaDisplayIndex = pageSource.indexOf('<QuotaDisplay />');
      const quickActionsIndex = pageSource.indexOf('grid grid-cols-1 md:grid-cols-3');
      
      expect(quotaDisplayIndex).toBeGreaterThan(-1);
      expect(quickActionsIndex).toBeGreaterThan(-1);
      expect(quotaDisplayIndex).toBeLessThan(quickActionsIndex);
    });
  });

  describe('Page Metadata', () => {
    it('should have proper page metadata', () => {
      // Verify metadata export exists
      expect(pageSource).toContain('export const metadata');
      expect(pageSource).toContain('title');
      expect(pageSource).toContain('description');
    });

    it('should have dashboard-specific title', () => {
      // Verify title contains Dashboard
      expect(pageSource).toMatch(/title.*Dashboard/);
    });
  });

  describe('Layout and Structure', () => {
    it('should have main content area', () => {
      // Verify main element exists
      expect(pageSource).toContain('<main');
    });

    it('should have footer', () => {
      // Verify footer element exists
      expect(pageSource).toContain('<footer');
    });

    it('should have proper page structure with navigation, main, and footer', () => {
      // Verify page structure order
      const navIndex = pageSource.indexOf('<nav');
      const mainIndex = pageSource.indexOf('<main');
      const footerIndex = pageSource.indexOf('<footer');
      
      expect(navIndex).toBeGreaterThan(-1);
      expect(mainIndex).toBeGreaterThan(-1);
      expect(footerIndex).toBeGreaterThan(-1);
      expect(navIndex).toBeLessThan(mainIndex);
      expect(mainIndex).toBeLessThan(footerIndex);
    });
  });
});
