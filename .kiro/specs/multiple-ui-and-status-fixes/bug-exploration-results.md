# Bug Condition Exploration Results - Task 1.1

## Test Execution Summary

**Task**: 1.1 Write bug condition exploration test for profile picture persistence

**Date**: Test executed and documented

**Status**: ✅ **BUG CONFIRMED** - Tests failed as expected, proving the bug exists

## Test Results

### Test File 1: `src/components/profile/EditProfileClient.bugfix.test.tsx`
- **Result**: ✅ All 6 tests PASSED
- **Finding**: EditProfileClient component is working correctly
  - Avatar uploads to storage successfully
  - Avatar URL is persisted in user metadata via `supabase.auth.updateUser()`
  - Form submission includes `avatar_url` in the data payload
  - Component correctly reads `avatar_url` from `user.user_metadata` on mount

**Conclusion**: The EditProfileClient component is NOT the source of the bug.

### Test File 2: `src/components/UserProfile.bugfix.test.tsx`
- **Result**: ❌ 3 tests FAILED (bug condition tests) ✅ 4 tests PASSED (preservation tests)
- **Finding**: UserProfile component is the source of the bug
  - Component fetches `full_name` from user metadata but does NOT fetch `avatar_url`
  - Component always displays initials-based avatars (hardcoded `bg-[#5b8ba8]`)
  - Uploaded profile pictures are completely ignored
  - No `<img>` element is rendered even when `avatar_url` exists in metadata

**Conclusion**: The UserProfile component is the source of the bug.

## Root Cause Analysis

### Initial Hypothesis (from design.md)
The design document hypothesized:
1. Missing metadata persistence in `handleSubmit` function
2. State management issue with avatar URL
3. Metadata retrieval issue on component mount

### Actual Root Cause (Discovered)
**The initial hypothesis was INCORRECT.** The actual root cause is:

1. **EditProfileClient works correctly**: 
   - Uploads avatar to storage ✅
   - Persists `avatar_url` in user metadata ✅
   - Reads `avatar_url` on component mount ✅

2. **UserProfile is the problem**:
   - Does NOT read `avatar_url` from `user.user_metadata` ❌
   - Always displays initials-based avatars ❌
   - Ignores uploaded profile pictures completely ❌

### Code Evidence

**EditProfileClient.tsx** (Lines 15, 82):
```typescript
const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url || '');

// ... later in handleSubmit:
await supabase.auth.updateUser({
  data: {
    full_name: fullName,
    avatar_url: avatarUrl,  // ✅ Correctly persists avatar_url
  },
});
```

**UserProfile.tsx** (Lines 22-37):
```typescript
const fetchUserProfile = async () => {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // ❌ Only fetches full_name, does NOT fetch avatar_url
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      setUserName(displayName);
      // ❌ Missing: setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
};
```

**UserProfile.tsx** (Lines 107-111):
```typescript
// ❌ Always displays initials, never checks for avatar_url
<div className="w-9 h-9 rounded-full bg-[#5b8ba8] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
  {getInitials()}
</div>
```

## Counterexamples Found

### Counterexample 1: Avatar Upload Without Display
**Scenario**: User uploads profile picture on edit profile page
- **Input**: User with `avatar_url='https://example.com/storage/avatar-test-user-123.jpg'` in metadata
- **Expected**: UserProfile displays uploaded avatar image
- **Actual**: UserProfile displays initials "TU" in blue circle
- **Evidence**: Test output shows no `<img>` element in rendered HTML

### Counterexample 2: Avatar Persists But Not Shown
**Scenario**: User navigates to different pages after uploading avatar
- **Input**: User metadata contains `avatar_url` after successful upload
- **Expected**: Avatar displays in navbar on all pages (home, dashboard, converters, etc.)
- **Actual**: Initials display on all pages, avatar is ignored
- **Evidence**: UserProfile component is used across all pages but never reads `avatar_url`

### Counterexample 3: Edit Profile Shows Avatar, Other Pages Don't
**Scenario**: User uploads avatar and sees it on edit profile page, then navigates away
- **Input**: User with uploaded avatar navigates from /profile/edit to /dashboard
- **Expected**: Avatar displays consistently on both pages
- **Actual**: Avatar shows on edit profile page, but initials show on dashboard
- **Evidence**: EditProfileClient reads `avatar_url`, but UserProfile (used on dashboard) does not

## Test Failure Details

### Failed Test 1: "should display uploaded avatar image when avatar_url exists in user metadata"
```
Error: expect(received).toBeInTheDocument()
received value must be an HTMLElement or an SVGElement.
```
**Reason**: No `<img>` element exists in the rendered output. UserProfile only renders a `<div>` with initials.

### Failed Test 2: "should NOT display initials when user has uploaded avatar"
```
Error: expect(received).toBeInTheDocument()
received value must be an HTMLElement or an SVGElement.
```
**Reason**: Initials "TU" are displayed even though `avatar_url` exists in metadata.

### Failed Test 3: "should display avatar in profile dropdown button"
```
Error: expect(received).toBeInTheDocument()
received value must be an HTMLElement or an SVGElement.
```
**Reason**: Profile dropdown button shows initials instead of avatar image.

## Preservation Tests (Passed)

The following tests passed, confirming existing functionality works correctly:

1. ✅ "should display initials when user has NO avatar_url"
2. ✅ "should display initials when avatar_url is empty string"
3. ✅ "should display user full name correctly"
4. ✅ "should use email for initials when no full_name exists"

These passing tests ensure that the bug fix will not break existing behavior for users without profile pictures.

## Impact Analysis

### Affected Components
1. **UserProfile.tsx** - Primary component that needs fixing
   - Used in: home, dashboard, converters, help center, privacy, terms, result pages
   - Impact: All pages that display user profile

2. **EditProfileClient.tsx** - Working correctly, no changes needed
   - Used in: /profile/edit page only
   - Impact: None (already working)

### User Experience Impact
- **Severity**: Medium-High
- **Frequency**: Affects 100% of users who upload profile pictures
- **Visibility**: Highly visible - affects navbar on every page
- **Workaround**: None - users cannot see their uploaded avatars anywhere except edit profile page

## Fix Requirements

Based on the bug exploration, the fix must:

1. **Update UserProfile component** to:
   - Fetch `avatar_url` from `user.user_metadata` in `fetchUserProfile()`
   - Store `avatar_url` in component state (add `useState` for avatar)
   - Conditionally render `<img>` when `avatar_url` exists
   - Render initials only when `avatar_url` is empty or missing
   - Use Next.js `Image` component for proper image optimization

2. **Preserve existing behavior**:
   - Continue displaying initials for users without avatars
   - Maintain initials color scheme (`bg-[#5b8ba8]`)
   - Keep all existing dropdown functionality
   - Preserve name display logic
   - Maintain responsive design

3. **Do NOT modify EditProfileClient**:
   - Component is working correctly
   - Avatar upload and persistence logic is sound
   - No changes needed

## Next Steps

1. ✅ **Task 1.1 Complete**: Bug condition exploration test written and executed
2. ⏭️ **Task 1.2**: Write bug condition exploration test for incorrect label text
3. ⏭️ **Task 1.3**: Write bug condition exploration test for incorrect search button text
4. ⏭️ **Task 1.4**: Write bug condition exploration test for inconsistent footer layouts
5. ⏭️ **Task 1.5**: Write bug condition exploration test for missing Home menu item
6. ⏭️ **Task 1.6**: Write bug condition exploration test for incorrect status display

## Recommendations

1. **Update Design Document**: The root cause analysis in design.md should be updated to reflect the actual bug location (UserProfile, not EditProfileClient)

2. **Update Tasks Document**: Task 3.1 should focus on UserProfile component, not EditProfileClient

3. **Consider Shared Avatar Component**: After fixing the bug, consider extracting avatar display logic into a shared component to prevent similar issues in the future

## Test Files Created

1. `src/components/profile/EditProfileClient.bugfix.test.tsx` - 6 tests (all passing)
2. `src/components/UserProfile.bugfix.test.tsx` - 7 tests (3 failing as expected, 4 passing)

Both test files are ready to validate the fix when implemented in Phase 3.
