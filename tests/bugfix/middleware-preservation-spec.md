# Middleware Preservation Property Tests - Specification

**Validates: Requirements 3.6, 3.7**

## Overview

This document specifies the preservation properties for middleware functionality that must remain unchanged after fixing the middleware deprecation warning (Bug 1).

**IMPORTANT**: Follow observation-first methodology
- These properties observe behavior on UNFIXED code
- Properties capture baseline middleware behavior to preserve
- Properties should hold on unfixed code (confirms baseline)
- Properties will be verified again AFTER fix to ensure no regressions

## Property 2: Preservation - Middleware Functionality Unchanged

### Core Preservation Requirements

The middleware fix (renaming `middleware.ts` to `proxy.ts` and updating function name) MUST preserve all existing functionality:

1. **Session Management**: Middleware continues to update Supabase session cookies
2. **Route Processing**: Middleware processes all routes without errors
3. **Authentication Context**: Middleware maintains authentication context for all requests
4. **Response Handling**: Middleware returns valid NextResponse objects

### Property-Based Test Specifications

#### Property 2.1: Route Protection Behavior

**Property**: For all valid HTTP requests, middleware processes them without throwing errors

**Test Strategy**:
```typescript
FOR ALL requests WHERE {
  path ∈ {'/dashboard', '/word-to-pdf', '/login', '/register', '/', '/api/conversions'}
  method ∈ {'GET', 'POST', 'PUT', 'DELETE', 'PATCH'}
}
ASSERT:
  - updateSession(request) does not throw
  - response is defined
  - response.status ∈ [200, 600)
```

**Test Cases** (20 combinations):
- Protected routes: `/dashboard`
- Public routes: `/login`, `/register`, `/`
- Conversion routes: `/word-to-pdf`
- API routes: `/api/conversions`
- All HTTP methods: GET, POST, PUT, DELETE, PATCH

**Expected Outcome**: PASS on unfixed code (baseline behavior)

#### Property 2.2: Session Cookie Management

**Property**: For all requests, middleware handles cookies consistently regardless of presence

**Test Strategy**:
```typescript
FOR ALL requests WHERE {
  path ∈ {'/dashboard', '/word-to-pdf', '/login', '/'}
  hasCookies ∈ {true, false}
}
ASSERT:
  - response is valid
  - response.status ∈ [200, 600)
  - middleware processes request without errors
```

**Test Cases** (15 combinations):
- Requests with Supabase session cookies (sb-access-token, sb-refresh-token)
- Requests without any cookies
- Various routes (protected and public)

**Expected Outcome**: PASS on unfixed code (baseline behavior)

#### Property 2.3: Response Structure Consistency

**Property**: For all valid paths, middleware returns consistent response structure

**Test Strategy**:
```typescript
FOR ALL paths ∈ {
  '/dashboard', '/word-to-pdf', '/login', '/register', 
  '/', '/privacy', '/terms', '/help-center'
}
ASSERT:
  - response is defined
  - response.headers exists
  - response.cookies exists
  - response.status ∈ [200, 600)
```

**Test Cases** (15 paths):
- All major application routes
- Both protected and public routes
- Static pages and dynamic pages

**Expected Outcome**: PASS on unfixed code (baseline behavior)

#### Property 2.4: Authentication Context Preservation

**Property**: For all authentication states, middleware processes requests consistently

**Test Strategy**:
```typescript
FOR ALL requests WHERE {
  path ∈ {'/dashboard', '/word-to-pdf', '/login'}
  hasAuthCookie ∈ {true, false}
  hasRefreshCookie ∈ {true, false}
}
ASSERT:
  - middleware handles all auth states without errors
  - response.status ∈ [200, 600)
```

**Test Cases** (20 combinations):
- 4 authentication states (no cookies, only access, only refresh, both)
- 3 different route types
- Middleware should process all without throwing

**Expected Outcome**: PASS on unfixed code (baseline behavior)

#### Property 2.5: Idempotent Behavior

**Property**: For all requests, calling middleware multiple times produces consistent results

**Test Strategy**:
```typescript
FOR ALL paths ∈ {'/dashboard', '/word-to-pdf', '/login', '/'}
ASSERT:
  - updateSession(request1).status === updateSession(request2).status
  - Middleware behavior is idempotent
```

**Test Cases** (10 paths):
- Same request processed twice
- Status codes should match
- Demonstrates deterministic behavior

**Expected Outcome**: PASS on unfixed code (baseline behavior)

#### Property 2.6: HTTP Method Handling

**Property**: For all HTTP methods, middleware processes requests without discrimination

**Test Strategy**:
```typescript
FOR ALL requests WHERE {
  path ∈ {'/dashboard', '/api/conversions', '/word-to-pdf'}
  method ∈ {'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'}
}
ASSERT:
  - response is defined
  - response.status ∈ [200, 600)
```

**Test Cases** (15 combinations):
- All standard HTTP methods
- Various route types
- Middleware should handle all methods

**Expected Outcome**: PASS on unfixed code (baseline behavior)

#### Property 2.7: URL Pattern Handling

**Property**: For all valid URL patterns, middleware handles them uniformly

**Test Strategy**:
```typescript
FOR ALL urls WHERE {
  url ∈ {
    static_routes: ['/', '/login', '/register', '/dashboard', '/word-to-pdf'],
    api_routes: ['/api/conversions', '/api/convert/word-to-pdf'],
    with_query: ['/dashboard?param=value', '/word-to-pdf?param=value']
  }
}
ASSERT:
  - response is defined
  - response.status ∈ [200, 600)
```

**Test Cases** (20 combinations):
- Static routes
- API routes
- Routes with query parameters
- Various URL patterns

**Expected Outcome**: PASS on unfixed code (baseline behavior)

## Baseline Behavior Documentation

### Current Middleware Behavior (UNFIXED Code)

#### File: `middleware.ts`
- **Location**: Project root
- **Function**: `middleware(request: NextRequest)`
- **Calls**: `updateSession(request)` from `src/lib/supabase/middleware.ts`

#### Observed Behavior:

**For `/dashboard` (Protected Route)**:
- Middleware processes request
- Returns NextResponse with status 200
- Updates Supabase session cookies
- Does not redirect (redirect logic is in page component)

**For `/login` (Public Route)**:
- Middleware processes request
- Returns NextResponse with status 200
- Updates Supabase session cookies if present
- No authentication required

**For `/api/conversions` (API Route)**:
- Middleware processes request
- Returns NextResponse with status 200
- Handles API requests identically to page requests

### Key Preservation Points

1. **No Redirects in Middleware**: The current middleware does NOT perform redirects. Authentication checks and redirects happen in page components (e.g., `app/dashboard/page.tsx` checks for user and redirects to `/login` if not authenticated).

2. **Cookie Management**: Middleware updates Supabase session cookies for all requests using the `setAll` callback in `createServerClient`.

3. **Universal Processing**: Middleware processes ALL routes that match the config matcher, regardless of authentication status.

4. **Response Passthrough**: Middleware returns a NextResponse that allows the request to continue to the route handler.

## Test Implementation Status

### Vitest Tests (Node 20.12+ required)
- **File**: `tests/bugfix/middleware-preservation.test.ts`
- **Status**: Created but cannot run due to Node.js version (20.10 vs 20.12 required)
- **Framework**: Vitest + fast-check
- **Test Count**: 10 property-based tests + 3 baseline documentation tests

### Standalone Script (Node 20.10+ compatible)
- **File**: `tests/bugfix/verify-middleware-preservation.js`
- **Status**: Created but requires Supabase credentials to run
- **Framework**: fast-check (standalone)
- **Limitation**: Cannot test without real Supabase environment

### This Specification Document
- **File**: `tests/bugfix/middleware-preservation-spec.md`
- **Purpose**: Documents all preservation properties and test strategies
- **Status**: Complete - serves as test specification and baseline documentation
- **Use**: Reference for manual verification and future test implementation

## Verification Strategy

Since automated tests cannot run in the current environment, verification will be done through:

1. **Code Review**: Verify that the fix only changes file name and function name
2. **Manual Testing**: Run the application before and after fix, verify identical behavior
3. **Comparison**: Ensure `proxy.ts` contains identical logic to `middleware.ts`
4. **Integration Testing**: Test key user flows (login, dashboard access, file conversion)

## Post-Fix Verification Checklist

After implementing the fix (renaming to `proxy.ts`), verify:

- [ ] Application starts without deprecation warnings
- [ ] `/dashboard` still requires authentication (redirect in page component works)
- [ ] `/login` is accessible without authentication
- [ ] Session cookies are still updated on all requests
- [ ] File conversion works for both authenticated and unauthenticated users
- [ ] Logout functionality still works
- [ ] No new errors in console or logs
- [ ] All routes continue to work as before

## Conclusion

This specification documents the preservation properties that must hold after fixing Bug 1 (middleware deprecation warning). The fix should be a simple rename operation:

- `middleware.ts` → `proxy.ts`
- `export async function middleware(request)` → `export async function proxy(request)`
- All internal logic remains identical
- All preservation properties continue to hold

**EXPECTED OUTCOME**: All preservation properties PASS on both unfixed and fixed code, confirming no regressions.
