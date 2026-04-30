#!/usr/bin/env node

/**
 * Bug Condition Exploration Test: Middleware Deprecation Warning
 * 
 * **Validates: Requirements 2.1, 2.2**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This is a standalone Node.js script that verifies the middleware deprecation bug.
 * Run with: node tests/bugfix/verify-middleware-bug.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== Bug 1: Middleware Deprecation Warning Verification ===\n');

const projectRoot = path.join(__dirname, '../..');
const middlewarePath = path.join(projectRoot, 'middleware.ts');
const proxyPath = path.join(projectRoot, 'proxy.ts');
const packageJsonPath = path.join(projectRoot, 'package.json');

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Verify Next.js version
console.log('Test 1: Verify Next.js version is 16.2.4');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const nextVersion = packageJson.dependencies.next;
  
  if (nextVersion === '16.2.4') {
    console.log('  ✓ PASS: Next.js version is 16.2.4');
    testsPassed++;
  } else {
    console.log(`  ✗ FAIL: Next.js version is ${nextVersion}, expected 16.2.4`);
    testsFailed++;
  }
} catch (error) {
  console.log('  ✗ FAIL: Could not read package.json');
  testsFailed++;
}

// Test 2: Verify middleware.ts exists (bug condition)
console.log('\nTest 2: Verify middleware.ts exists (bug condition)');
const middlewareExists = fs.existsSync(middlewarePath);

if (middlewareExists) {
  console.log('  ✓ PASS: middleware.ts exists (bug condition confirmed)');
  console.log('  Note: This file uses deprecated convention in Next.js 16');
  testsPassed++;
} else {
  console.log('  ✗ FAIL: middleware.ts does not exist');
  testsFailed++;
}

// Test 3: Expected behavior - middleware.ts should NOT exist (should be proxy.ts)
console.log('\nTest 3: Expected behavior - middleware.ts should NOT exist');
const proxyExists = fs.existsSync(proxyPath);

console.log(`  middleware.ts exists: ${middlewareExists}`);
console.log(`  proxy.ts exists: ${proxyExists}`);

if (!middlewareExists && proxyExists) {
  console.log('  ✓ PASS: Bug is fixed - proxy.ts exists, middleware.ts removed');
  testsPassed++;
} else if (middlewareExists && !proxyExists) {
  console.log('  ✗ FAIL: Bug still exists - middleware.ts should be renamed to proxy.ts');
  console.log('  This is EXPECTED on unfixed code - it confirms the bug exists');
  testsFailed++;
} else if (middlewareExists && proxyExists) {
  console.log('  ⚠ WARNING: Both middleware.ts and proxy.ts exist');
  testsFailed++;
} else {
  console.log('  ✗ FAIL: Neither middleware.ts nor proxy.ts exists');
  testsFailed++;
}

// Summary
console.log('\n=== Test Summary ===');
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);

if (middlewareExists && !proxyExists) {
  console.log('\n⚠️  BUG CONFIRMED:');
  console.log('  - middleware.ts file exists (deprecated convention)');
  console.log('  - Expected: File should be renamed to proxy.ts');
  console.log('  - This will cause deprecation warning: "The middleware file convention is deprecated. Please use proxy instead."');
  console.log('  - Fix: Rename middleware.ts to proxy.ts and update function name from middleware to proxy');
  console.log('\nTo see the actual deprecation warning, run: npm run dev');
  process.exit(1); // Exit with error code to indicate bug exists
} else if (!middlewareExists && proxyExists) {
  console.log('\n✓ Bug is fixed! No deprecation warnings should appear.');
  process.exit(0);
} else {
  console.log('\n⚠️  Unexpected state - manual investigation required');
  process.exit(1);
}
