// Vitest setup file
// Load environment variables for testing
import { config } from 'dotenv';
import '@testing-library/jest-dom';

config({ path: '.env.local' });
