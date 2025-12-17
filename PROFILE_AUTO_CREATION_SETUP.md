# Profile Auto-Creation Setup for All Auth Methods

## Overview

This setup ensures that a profile is automatically created for users when they sign up or log in using any authentication method (password, GitHub, Resend email).

## Components

### 1. **auth.ts** - Core Profile Mutations

Two main functions handle profile creation:

- **`createProfileIfNotExists(username, email, avatar_url)`**

  - Used for password-based signup (explicit username entry)
  - Called in SignUpForm after successful password signup
  - Requires all parameters

- **`createOrGetOAuthProfile(username?, email?, avatar_url?)`**

  - Used for OAuth providers (GitHub, Resend)
  - Optional parameters - creates "User" username if not provided
  - Called in login/signup forms and as fallback

- **`getCurrentUserProfile()`**
  - Query to fetch the logged-in user's profile
  - Used by ProfileInitializer to check if profile exists

### 2. **ProfileInitializer** - Automatic Profile Creation

New component (`components/auth/profile-initializer.tsx`) that:

- Runs on every app load within ConvexClientProvider
- Checks if authenticated user has a profile
- Automatically creates one if missing (idempotent)
- Handles edge cases where OAuth users bypass signup form

**How it works:**

```tsx
useEffect(() => {
  if (!authLoading && currentUserProfile === null) {
    createOrGetOAuthProfile({...}).catch(...) // Silent fail
  }
}, [authLoading, currentUserProfile])
```

### 3. **SignUpForm** - Password Signup

Flow:

1. User enters username, email, password
2. `signIn("password", formData)` - creates auth user
3. `createProfileIfNotExists(username, email)` - creates profile
4. Redirects to `/gioca`

### 4. **LoginForm** - OAuth Login

Flow:

1. User clicks GitHub login button
2. `signIn("github", formData)` - authenticates via GitHub
3. `createOrGetOAuthProfile()` - tries to create profile
4. ProfileInitializer handles as fallback
5. Redirects to `/gioca`

### 5. **SignUpForm** - OAuth Signup (GitHub button added)

Flow:

1. User clicks "Sign up with GitHub"
2. `signIn("github", formData)` - authenticates via GitHub
3. `createOrGetOAuthProfile()` - tries to create profile
4. ProfileInitializer handles as fallback
5. Redirects to `/gioca`

## Flow Diagram

```
User Signs Up / Logs In
        ↓
    ┌───┴────────────────────────────┐
    ↓                                 ↓
Password Form                    OAuth (GitHub)
    ↓                                 ↓
signIn("password", ...)          signIn("github", ...)
    ↓                                 ↓
createProfileIfNotExists         createOrGetOAuthProfile
    ↓                                 ↓
    └────────────┬────────────────────┘
                 ↓
         Redirect to /gioca
                 ↓
         App Loads (Layout)
                 ↓
         ProfileInitializer Runs
                 ↓
         ┌───────┴────────┐
         ↓                ↓
    Profile Exists?   No Profile?
         ↓                ↓
      Done       createOrGetOAuthProfile
                 (Safety Net)
```

## Key Features

✅ **Handles all auth methods:**

- Password signup (explicit data)
- GitHub OAuth (auto-generate defaults)
- Resend email (auto-generate defaults)

✅ **Idempotent:**

- Checks for existing profile before creating
- Won't duplicate on concurrent calls

✅ **Resilient:**

- Multiple ways to trigger profile creation
- ProfileInitializer as safety net
- Graceful error handling

✅ **User-friendly:**

- No manual profile creation needed
- Automatic redirect to game
- Error toasts on failure

## Configuration

No additional setup needed - just ensure:

1. `NEXT_PUBLIC_CONVEX_URL` env variable is set
2. GitHub OAuth secrets configured in Convex (if using GitHub)
3. Resend API key configured (if using Resend email)

All profiles initialize with:

- `total_score: 0`
- `games_played: 0`
- Optional avatar_url (from OAuth provider if available)
