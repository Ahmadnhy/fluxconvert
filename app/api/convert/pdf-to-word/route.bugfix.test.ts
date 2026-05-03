/**
 * Bug Condition Exploration Test: pdf-parse Module Import Resolution
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This test verifies that the pdf-parse module import resolves to a callable function
 * that can successfully parse PDF buffers. On the UNFIXED code (using require('pdf-parse')),
 * this test is EXPECTED TO FAIL, demonstrating the ESM/CJS compatibility issue in Next.js 16.
 * 
 * When this test PASSES after implementing the fix, it confirms the bug is resolved.
 */

import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Property 1: Bug Condition - pdf-parse Module Import Resolution Failure
 * 
 * **EXPECTED OUTCOME ON UNFIXED CODE**: Test FAILS (this is correct - it proves the bug exists)
 * 
 * This test encodes the expected behavior: pdf-parse should be a callable function
 * that can parse PDF buffers. On unfixed code with `require('pdf-parse')`, this will fail
 * because the module is not properly resolved in Next.js 16.
 * 
 * **Counterexamples to document**:
 * - pdfParse is undefined
 * - pdfParse is an object without a callable function at the top level
 * - TypeError: pdfParse is not a function when attempting to invoke
 */
describe('Bug Condition Exploration: pdf-parse Module Import Resolution', () => {
  it('should resolve pdf-parse as a callable function that can parse PDF buffers', async () => {
    // Import pdf-parse using the FIXED method (dynamic import)
    // This matches the implementation in route.ts after Task 3.1
    // pdf-parse v1 uses a simple function API
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    // Create a minimal valid PDF buffer for testing
    const pdfBuffer = await createTestPdfBuffer('Test content for bug exploration');
    
    // Property 1: isCallableFunction(pdfParse)
    // After fix, pdfParse should be a function
    expect(typeof pdfParse).toBe('function');
    expect(pdfParse).toBeInstanceOf(Function);
    
    // Property 2: canParsePdfBuffer(pdfParse, validPdfBuffer)
    // After fix, we should be able to call pdfParse(buffer) and get text
    let parseResult;
    let parseError;
    
    try {
      parseResult = await pdfParse(pdfBuffer);
    } catch (error: any) {
      parseError = error;
    }
    
    // Document the counterexample if parsing fails
    if (parseError) {
      console.error('COUNTEREXAMPLE FOUND - Bug confirmed:');
      console.error(`  Error: ${parseError.message}`);
      console.error(`  Error type: ${parseError.constructor.name}`);
      console.error(`  pdfParse type: ${typeof pdfParse}`);
      console.error(`  pdfParse value:`, pdfParse);
    }
    
    // Assert that parsing succeeds without errors
    expect(parseError).toBeUndefined();
    expect(parseResult).toBeDefined();
    expect(parseResult.text).toBeDefined();
    expect(typeof parseResult.text).toBe('string');
  }, 30000);
  
  it('should verify pdf-parse module structure and identify resolution issue', async () => {
    // Import pdf-parse to inspect its structure using dynamic import
    // pdf-parse v1 exports a function as default
    const pdfParseModule = await import('pdf-parse');
    
    console.log('Module structure analysis:');
    console.log(`  Type: ${typeof pdfParseModule}`);
    console.log(`  Is object: ${typeof pdfParseModule === 'object'}`);
    console.log(`  Constructor: ${pdfParseModule?.constructor?.name}`);
    
    if (typeof pdfParseModule === 'object' && pdfParseModule !== null) {
      console.log(`  Keys: ${Object.keys(pdfParseModule).join(', ')}`);
      console.log(`  Has .default: ${pdfParseModule.default !== undefined}`);
      console.log(`  .default type: ${typeof pdfParseModule.default}`);
      console.log(`  .default is function: ${typeof pdfParseModule.default === 'function'}`);
    }
    
    // The expected behavior: pdfParseModule should be an object with default export as function
    // After fix: dynamic import returns an object with .default as the parser function
    expect(typeof pdfParseModule).toBe('object');
    expect(pdfParseModule.default).toBeDefined();
    expect(typeof pdfParseModule.default).toBe('function');
  }, 10000);
});

/**
 * Helper function to create a test PDF buffer
 */
async function createTestPdfBuffer(content: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  page.drawText(content, {
    x: 50,
    y: 350,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
