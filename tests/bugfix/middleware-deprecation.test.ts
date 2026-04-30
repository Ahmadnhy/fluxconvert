/**
 * Bug Condition Exploration Test: Middleware Deprecation Warning
 * 
 * **Validates: Requirements 2.1, 2.2**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test encodes the expected behavior - it will validate the fix when it passes after implementation
 * 
 * GOAL: Surface evidence that the deprecation warning appears in Next.js 16.2.4
 * 
 * Bug Condition: Running the application with Next.js 16.2.4 and middleware.ts at project root
 * Expected Behavior: No deprecation warnings should appear
 * 
 * EXPECTED OUTCOME: Test FAILS (this is correct - it proves the bug exists)
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

describe('Bug 1: Middleware Deprecation Warning Detection', () => {
  it('should verify middleware.ts file exists (bug condition)', () => {
    // This test verifies the bug condition: middleware.ts file exists at project root
    const projectRoot = join(__dirname, '../..');
    const middlewarePath = join(projectRoot, 'middleware.ts');
    
    console.log('\n=== Bug Condition Verification ===');
    console.log('Checking for middleware.ts at:', middlewarePath);
    
    const middlewareExists = existsSync(middlewarePath);
    console.log('middleware.ts exists:', middlewareExists);
    
    if (middlewareExists) {
      console.log('✓ Bug condition confirmed: middleware.ts uses deprecated convention in Next.js 16');
      console.log('  According to Next.js 16 docs, this file should be named proxy.ts');
    }
    
    // This confirms the bug condition exists
    expect(middlewareExists).toBe(true);
  });

  it('should verify Next.js version is 16.2.4', () => {
    // Verify we're testing against the correct Next.js version
    const projectRoot = join(__dirname, '../..');
    const packageJson = require(join(projectRoot, 'package.json'));
    
    console.log('\n=== Next.js Version Check ===');
    console.log('Next.js version:', packageJson.dependencies.next);
    
    expect(packageJson.dependencies.next).toBe('16.2.4');
  });

  it('should NOT have middleware.ts file (expected behavior after fix)', () => {
    // This test encodes the EXPECTED behavior after the fix
    // On UNFIXED code: This will FAIL (middleware.ts exists)
    // On FIXED code: This will PASS (middleware.ts renamed to proxy.ts)
    
    const projectRoot = join(__dirname, '../..');
    const middlewarePath = join(projectRoot, 'middleware.ts');
    const proxyPath = join(projectRoot, 'proxy.ts');
    
    console.log('\n=== Expected Behavior Verification ===');
    
    const middlewareExists = existsSync(middlewarePath);
    const proxyExists = existsSync(proxyPath);
    
    console.log('middleware.ts exists:', middlewareExists);
    console.log('proxy.ts exists:', proxyExists);
    
    if (middlewareExists) {
      console.log('\n⚠️  BUG DETECTED:');
      console.log('  middleware.ts file still exists (deprecated convention)');
      console.log('  Expected: File should be renamed to proxy.ts');
      console.log('  This will cause deprecation warnings in Next.js 16.2.4');
    } else if (proxyExists) {
      console.log('\n✓ Bug fixed: proxy.ts exists (correct convention for Next.js 16)');
    }
    
    // ASSERTION: middleware.ts should NOT exist (should be renamed to proxy.ts)
    // On UNFIXED code: This will FAIL (expected - proves bug exists)
    // On FIXED code: This will PASS (confirms bug is fixed)
    expect(middlewareExists).toBe(false);
    expect(proxyExists).toBe(true);
  });
});
