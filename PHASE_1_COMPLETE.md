# Supabase to Convex Migration - Phase 1: Auth Setup ✅ COMPLETE

## Summary

Successfully completed Phase 1 of the migration plan, establishing a solid foundation for the Convex backend with authentication, schema, and core infrastructure.

## What Was Completed

### 1. **Convex Project Initialization** ✅

- Created `/convex` directory structure
- Installed Convex package (already in dependencies)
- Set up all required subdirectories (mutations, queries, actions, lib)

### 2. **Convex Schema Definition** ✅

**File**: `convex/schema.ts`

Created 7 tables with full type safety:

- **profiles**: User profiles with score tracking (indexes: by_user_id, by_email)
- **games**: Game sessions with status, rounds, drawer tracking (indexes: by_code, by_status, by_created_by)
- **players**: Game participants with scores (indexes: by_game_id, by_game_and_player, by_player_id)
- **cards**: Drawing prompts with usage tracking (indexes: by_game_id, by_game_and_unused)
- **guesses**: User guesses with correctness tracking (indexes: by_game_id, by_turn_id, by_player_id)
- **drawings**: Canvas data with JSON strokes + file storage (indexes: by_game_id, by_turn_id)
- **turns**: Turn management with timing (indexes: by_game_id, by_game_and_round, by_drawer_id)

### 3. **Permission Utilities** ✅

**File**: `convex/lib/permissions.ts`

Reusable helpers for mutations:

- `requireAuth()` - Get authenticated user ID
- `isGameHost()` - Check host permission
- `isGamePlayer()` - Check player in game
- `canGuess()` - Check if user can guess (not drawer)
- `isCurrentDrawer()` - Check if user is drawer

### 4. **Convex Auth Setup** ✅

**Files**:

- `convex/auth.config.ts` - GitHub OAuth configuration
- `convex/auth.ts` - Profile creation mutations

Features:

- GitHub OAuth provider ready (requires GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET)
- Auto-create profile on signup
- Get current user profile query

### 5. **Atomic Game Mutations** ✅

**Files**:

- `convex/mutations/games.ts` - Game CRUD operations

  - `createGame()` - Create with code generation
  - `joinGame()` - Join by code
  - `startGame()` - Start with validation
  - `leaveGame()` - Leave/delete game
  - `generateAndStoreCards()` - Internal mutation for card generation

- `convex/mutations/game.ts` - Turn management
  - `submitGuessAndCompleteTurn()` - Atomic guess + turn completion
  - `completeGameTurn()` - Turn completion (time/manual)
  - `startNewTurn()` - Start turn for drawer

### 6. **Data Access Layer (Queries)** ✅

**Files**:

- `convex/queries/games.ts` - Game queries
- `convex/queries/players.ts` - Player & leaderboard queries
- `convex/queries/cards.ts` - Card queries
- `convex/queries/guesses.ts` - Guess queries (with turn filtering)
- `convex/queries/turns.ts` - Turn queries (with pagination)
- `convex/queries/profiles.ts` - Profile & leaderboard queries

### 7. **Convex Actions** ✅

**Files**:

- `convex/actions/generateCards.ts` - Groq AI card generation

  - Uses `@ai-sdk/groq` with mixtral model
  - Returns structured cards with descriptions

- `convex/actions/uploadDrawing.ts` - File storage
  - Upload PNG screenshots
  - Get signed URLs
  - File metadata queries

### 8. **Convex Client & Auth Hooks** ✅

**Files**:

- `lib/convex/client.ts` - Convex client initialization
- `hooks/useAuth.ts` - Auth and profile hooks

  - `useAuthenticatedUser()` - Current user with profile
  - `useCurrentGame()` - Current game session

- `hooks/useConvexSubscriptions.ts` - Phase 1 subscription hooks

  - `useGameState()` - Game state updates
  - `useGamePlayers()` - Player list
  - `useGameGuesses()` - Guesses in real-time
  - `useTurnsHistory()` - Turn history with pagination
  - `useCurrentTurn()` - Current turn state
  - `useCurrentCard()` - Current card
  - `useGameLeaderboard()` - Leaderboard

- `components/convex-provider.tsx` - React provider wrapper

### 9. **Updated Authentication Routes** ✅

**Files**:

- `components/auth/login-form.tsx` - Updated to use Convex Auth

  - GitHub OAuth only (simplified UX)
  - Uses `useAuthActions()` hook

- `components/auth/sign-up-form.tsx` - Updated to use Convex Auth

  - GitHub OAuth with username/email input
  - Creates profile after signup

- `app/layout.tsx` - Replaced Supabase provider with Convex provider

## What's Ready for Phase 2

All infrastructure is in place for Phase 2 (Game Logic Implementation):

- ✅ Database schema with proper indexing
- ✅ Permission system for RLS
- ✅ Atomic mutations for consistency
- ✅ Query layer with pagination
- ✅ Real-time subscriptions via Convex useQuery hooks
- ✅ File storage for drawings
- ✅ AI integration for card generation
- ✅ Auth system with GitHub OAuth

## Environment Variables Needed

Add to `.env.local` or Convex Dashboard:

```
GITHUB_CLIENT_ID=<your_github_client_id>
GITHUB_CLIENT_SECRET=<your_github_client_secret>
NEXT_PUBLIC_CONVEX_URL=<your_convex_deployment_url>
GROQ_API_KEY=********************
```

## Next Steps (Phase 2)

**Timeline**: Days 4-6

1. Integrate Convex client initialization with dev server
2. Update game components to use Convex queries/mutations
3. Update main app pages (game, gioca, history, profile)
4. E2E testing with real game flow
5. Performance benchmarking

## Architecture Highlights

### Real-time Pattern (Phase 1)

Using `useQuery` with polling:

- Each component queries the data it needs
- Convex handles real-time updates
- Scales well for typical game sizes

### Phase 2 Optimization (Post-v1)

Will create compound queries:

- `getActiveGameData()` - Single query for game + players + guesses + current card
- Reduces network roundtrips
- Fewer DB operations

### Atomic Transactions

Single mutations handle complex operations:

- `submitGuessAndCompleteTurn()` is fully atomic
- No race conditions between guess → score → turn advance
- Convex auto-rolls back on error

### Type Safety

- Generated types from `convex/_generated/api`
- Full IDE autocomplete in React components
- No manual type sync needed

---

**Status**: Ready for Phase 2 - Game Logic Implementation
**Last Updated**: 2024-12-16
