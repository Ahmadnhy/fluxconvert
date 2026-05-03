# pdf-parse-import-fix Bugfix Design

## Overview

The PDF to Word conversion feature fails with `TypeError: pdfParse is not a function` due to an ESM/CJS module compatibility issue in Next.js 16. The current code uses `require('pdf-parse')` which does not properly resolve the module's default export in Next.js 16's stricter module system. This fix will replace the CommonJS require with a proper dynamic import that correctly handles the ESM module structure, ensuring the pdf-parse function is properly resolved and callable.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when the pdf-parse module is imported using `require()` in Next.js 16, resulting in an undefined or non-callable function reference
- **Property (P)**: The desired behavior when pdf-parse is imported - the module should be properly resolved as a callable function that can parse PDF buffers
- **Preservation**: Existing PDF parsing behavior, text extraction, Word document generation, and all other conversion pipeline operations that must remain unchanged by the fix
- **pdfParse**: The function from the `pdf-parse` npm package (v2.4.5) that extracts text content from PDF buffers
- **ESM/CJS Compatibility**: The challenge of importing ECMAScript modules (ESM) in a CommonJS (CJS) context, particularly in Next.js 16's module system
- **Dynamic Import**: The `import()` function that loads modules asynchronously and returns a Promise, properly handling ESM default exports

## Bug Details

### Bug Condition

The bug manifests when the pdf-parse module is imported using `require('pdf-parse')` at the top level of the route handler file. In Next.js 16, this CommonJS import pattern fails to properly resolve the ESM module's default export, resulting in `pdfParse` being undefined or not recognized as a function when invoked at line 149.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ModuleImportContext
  OUTPUT: boolean
  
  RETURN input.importMethod == 'require'
         AND input.moduleName == 'pdf-parse'
         AND input.nextJsVersion >= 16
         AND input.moduleType == 'ESM'
         AND NOT isCallableFunction(input.resolvedModule)
END FUNCTION
```

### Examples

- **Example 1**: User uploads a valid PDF file → Code reaches line 149 `await pdfParse(buffer)` → TypeError: pdfParse is not a function → Conversion fails with 500 error
- **Example 2**: Authenticated user uploads PDF → File upload succeeds → Conversion record created → PDF parsing attempted → TypeError thrown → Conversion status updated to 'failed'
- **Example 3**: Anonymous user uploads PDF → File stored successfully → PDF parsing attempted → TypeError: pdfParse is not a function → Error response returned to client
- **Edge Case**: Very large PDF file (near 50MB limit) uploaded → All validation passes → Parsing attempted → TypeError occurs regardless of file size or content

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- PDF text extraction must continue to work exactly as before once the import is fixed
- Word document generation from extracted text must remain unchanged
- File upload, storage, and database operations must continue to function identically
- Canvas polyfill initialization (DOMMatrix, ImageData, Path2D) must remain unchanged
- Error handling for empty PDFs, corrupted PDFs, and DOCX generation failures must remain unchanged
- Conversion status tracking for authenticated users must continue to work as before
- Response format (JSON with downloadUrl, fileName, fileSize) must remain unchanged
- Signed URL generation for authenticated users must continue to work
- Base64 fallback for anonymous users must continue to work

**Scope:**
All code paths that do NOT involve the pdf-parse module import should be completely unaffected by this fix. This includes:
- File validation (type checking, size limits)
- Supabase authentication and user retrieval
- Storage operations (uploadFile, generateSignedUrl)
- Database operations (createFileRecord, createConversionRecord, updateConversionStatus)
- DOCX generation using the docx library
- Error response formatting
- File size formatting utility function

## Hypothesized Root Cause

Based on the bug description and Next.js 16's module system changes, the most likely issues are:

1. **ESM Default Export Resolution**: The `require('pdf-parse')` call returns a module object with a `default` property containing the actual function, but the code treats the module object itself as the function. In Next.js 16, this mismatch is not automatically resolved.

2. **Next.js 16 Module System Changes**: Next.js 16 has stricter ESM/CJS interoperability rules. The framework no longer automatically unwraps default exports from ESM modules when using `require()`, causing the function to be nested under `.default`.

3. **Webpack Configuration**: Next.js 16 may have changed how it handles external dependencies or module resolution, causing pdf-parse to be treated differently than in previous versions.

4. **Module Cache Issues**: The top-level `require()` call may be caching an incorrectly resolved module reference that persists across requests.

## Correctness Properties

Property 1: Bug Condition - pdf-parse Module Import Resolution

_For any_ module import context where pdf-parse is imported in a Next.js 16 API route, the fixed import mechanism SHALL properly resolve the pdf-parse function as a callable function that can successfully parse PDF buffers and extract text content.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - PDF Conversion Pipeline Behavior

_For any_ code execution path that does NOT involve the pdf-parse module import statement (file validation, storage operations, database operations, DOCX generation, error handling), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for the entire conversion pipeline.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct (ESM default export resolution issue):

**File**: `app/api/convert/pdf-to-word/route.ts`

**Function**: Module-level import and PDF parsing logic

**Specific Changes**:

1. **Replace CommonJS require with Dynamic Import**: Replace line 38 `const pdfParse = require('pdf-parse');` with a dynamic import that properly handles the ESM default export.

2. **Handle Async Import in POST Handler**: Since dynamic imports are asynchronous, move the import inside the POST function or use a lazy initialization pattern to ensure the module is loaded before use.

3. **Access Default Export Correctly**: Ensure the imported module's `.default` property is accessed if the dynamic import returns a module object rather than the function directly.

4. **Alternative: Add Webpack Externals Configuration**: If dynamic import proves problematic, configure Next.js webpack to properly handle pdf-parse as an external or with specific module resolution rules in `next.config.ts`.

5. **Maintain Runtime Configuration**: Keep `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'` to ensure the route runs in Node.js environment where pdf-parse dependencies are available.

**Recommended Implementation Approach**:

Option A (Dynamic Import - Preferred):
```typescript
// Remove: const pdfParse = require('pdf-parse');
// Add inside POST function before usage:
const pdfParseModule = await import('pdf-parse');
const pdfParse = pdfParseModule.default || pdfParseModule;
```

Option B (Lazy Initialization):
```typescript
// At module level:
let pdfParse: any = null;
async function getPdfParse() {
  if (!pdfParse) {
    const module = await import('pdf-parse');
    pdfParse = module.default || module;
  }
  return pdfParse;
}
// In POST function:
const parser = await getPdfParse();
textResult = await parser(buffer);
```

Option C (Webpack Configuration):
```typescript
// In next.config.ts:
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    'pdf-parse': require.resolve('pdf-parse'),
  };
  return config;
}
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code by attempting to import and use pdf-parse, then verify the fix works correctly across different scenarios and preserves all existing conversion pipeline behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that `require('pdf-parse')` fails to resolve a callable function in Next.js 16. If we cannot reproduce the error, we will need to re-hypothesize.

**Test Plan**: Write tests that attempt to import pdf-parse using the current `require()` method and verify that it fails to resolve as a callable function. Then attempt to invoke it with a PDF buffer to observe the TypeError. Run these tests on the UNFIXED code to confirm the root cause.

**Test Cases**:
1. **Import Resolution Test**: Verify that `require('pdf-parse')` returns an object without a callable function at the top level (will fail on unfixed code)
2. **Function Invocation Test**: Attempt to call `pdfParse(buffer)` with a valid PDF buffer and observe TypeError (will fail on unfixed code)
3. **Module Structure Test**: Inspect the structure of the required module to identify where the actual function is located (e.g., `.default` property)
4. **Next.js 16 Environment Test**: Verify the test runs in a Next.js 16 API route context to ensure environment matches production (may fail on unfixed code)

**Expected Counterexamples**:
- `pdfParse` is undefined or is an object without a callable function
- TypeError: pdfParse is not a function when attempting to parse a PDF buffer
- Possible causes: ESM default export not unwrapped, module object returned instead of function, webpack misconfiguration

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (pdf-parse import in Next.js 16), the fixed import mechanism produces a callable function that successfully parses PDF buffers.

**Pseudocode:**
```
FOR ALL importContext WHERE isBugCondition(importContext) DO
  pdfParse := importPdfParse_fixed(importContext)
  ASSERT isCallableFunction(pdfParse)
  ASSERT canParsePdfBuffer(pdfParse, validPdfBuffer)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all code paths where the bug condition does NOT hold (all non-import-related operations), the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL operation WHERE NOT isImportOperation(operation) DO
  ASSERT executeOperation_original(operation) = executeOperation_fixed(operation)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different PDF files, user states, file sizes)
- It catches edge cases that manual unit tests might miss (boundary conditions, empty files, large files)
- It provides strong guarantees that behavior is unchanged for all non-import-related operations

**Test Plan**: Observe behavior on UNFIXED code first for file uploads, storage operations, database operations, and DOCX generation, then write property-based tests capturing that behavior. Verify the fixed code produces identical results.

**Test Cases**:
1. **File Upload Preservation**: Observe that file upload to Supabase storage works correctly on unfixed code (before PDF parsing), then verify this continues after fix
2. **Database Operations Preservation**: Observe that file records and conversion records are created correctly on unfixed code, then verify this continues after fix
3. **DOCX Generation Preservation**: Observe that DOCX generation from text works correctly (using mocked pdf-parse in tests), then verify this continues after fix
4. **Error Handling Preservation**: Observe that error responses for invalid files, empty PDFs, and size limits work correctly, then verify this continues after fix

### Unit Tests

- Test that pdf-parse import resolves to a callable function after fix
- Test that PDF parsing works with valid PDF files containing text
- Test that error handling works for corrupted PDFs
- Test that error handling works for empty PDFs (no extractable text)
- Test that file size validation continues to work (50MB limit)
- Test that file type validation continues to work (.pdf extension)
- Test that authenticated user flow creates conversion records
- Test that anonymous user flow works without conversion records

### Property-Based Tests

- Generate random valid PDF files and verify parsing succeeds with fixed import
- Generate random file sizes (within limits) and verify upload/storage behavior is preserved
- Generate random user authentication states and verify database operations are preserved
- Generate random text content and verify DOCX generation behavior is preserved
- Test that all error conditions (invalid type, oversized file, empty PDF) continue to work across many scenarios

### Integration Tests

- Test full PDF to Word conversion flow with fixed import for authenticated users
- Test full PDF to Word conversion flow with fixed import for anonymous users
- Test that signed URL generation works correctly after fix
- Test that base64 fallback works correctly after fix
- Test that conversion status tracking (pending → completed/failed) works correctly after fix
- Test that canvas polyfill initialization continues to work with fixed import
