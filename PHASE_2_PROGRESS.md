# Phase 2 Progress: Supabase to Convex Migration (UI Components)

**Status**: In Progress (60% complete)
**Timeline**: Days 4-6
**Last Updated**: Current session

## ✅ Completed Tasks

### 1. Game Forms Updated

- **CreateGameForm** ✅

  - Replaced Supabase imports with Convex mutations
  - Uses `api.mutations.games.createGame`
  - Schema simplified: category + maxRounds (defaults to 5)
  - Returns game ID and code for routing

- **JoinGameForm** ✅
  - Uses `api.mutations.games.joinGame`
  - Code length: 4 characters (was 6 in Supabase)
  - No user parameter needed (Convex auth handles it)

### 2. Main Pages Updated

- **gioca/page.tsx** ✅

  - Converted from async server component to client component
  - Removed Supabase auth check
  - Forms handle auth internally via Convex hooks

- **game/[code]/page.tsx** ✅

  - Converted from async to client component
  - Uses `useQuery(api.queries.games.getGameByCode)`
  - Passes gameId to GameClientPage

- **profile/page.tsx** ✅
  - Converted from async to client component
  - Uses `useAuthenticatedUser()` hook
  - Integrated redirect logic in useEffect

### 3. Display Components Updated

- **GameLobby** ✅

  - Updated props: separate `game` and `players` parameters
  - Changed `isDrawer` → `isHost` boolean
  - Removed max_players references

- **ProfileContent** ✅

  - Updated interface to use `Id<"profiles">` type
  - Display: username, email, total_score, games_played
  - Avatar rendering updated

- **GameClientPage** ✅
  - Replaced Supabase hooks with Convex subscriptions
  - Added `useAuthenticatedUser()` hook
  - Integrated `startGameMutation`
  - Game status: "waiting" | "started" | "finished"

### 4. History Page (Complete Rewrite)

- **history/page.tsx** ✅

  - Converted from async to client component with `useQuery`
  - Uses pagination with Convex
  - Fetches categories and game list

- **game-history-card** ✅

  - Updated to fetch turns and players data via `useQuery`
  - Displays turn details with drawer/winner information
  - Shows category badges and player scores

- **history-filters** ✅
  - Simplified from server actions to client-side URL management
  - Uses `useRouter` to update search params

### 5. Convex Backend Updates

- **convex/schema.ts** ✅

  - Added composite index: `by_created_by_and_status` for efficient filtering

- **convex/queries/history.ts** ✅
  - `getUserGameHistory` - Paginated finished games by user
  - `getUserGameCategories` - Unique categories for filter
  - `getGameHistoryDetails` - Single game details
  - `getGameTurnsWithDetails` - All turns with related data
  - `getGamePlayers` - Players for a game with scores

## ⏳ In Progress

### GameBoard Component (CRITICAL - 40% of remaining work)

**File**: `components/game/game-board.tsx` (601 lines)
**Status**: Not started
**Dependencies**: Drawing canvas, timer, atomic submissions
**Blocking**: Core game functionality

**Required Changes**:

1. Replace Supabase imports with Convex mutations:

   - `submitGuessAtomic` → `useMutation(api.mutations.game.submitGuessAndCompleteTurn)`
   - `startTurn` → `useMutation(api.mutations.game.startNewTurn)`
   - `completeTimeUpTurn` → `useMutation(api.mutations.game.completeTimeUpTurn)`
   - `completeManualWinnerTurn` → `useMutation(api.mutations.game.completeManualWinnerTurn)`

2. Update game state handling:

   - Replace `game.timer_end` with timestamp calculation
   - Update game status checks: "active" → "started"
   - Handle Convex real-time subscriptions

3. Drawing & file upload:

   - Keep `captureAndUploadDrawing` for now (may need Convex action)
   - Integrate with Convex storage

4. Handle 50+ event handlers:
   - Guess submission logic
   - Timer completion
   - Manual winner selection
   - Drawing capture

**Estimated Effort**: 2-3 hours

## ❌ Not Started

### GameOver Component

**File**: `components/game/game-over.tsx`
**Status**: Not reviewed
**Estimated Effort**: 30 minutes

### Remaining Components

- DrawingCanvas (may need drawing storage updates)
- Timer (logic should remain mostly same)
- PlayerList, ScoreLegend (minimal changes expected)

## 🔧 Technical Notes

### Key Pattern Changes

```typescript
// OLD: Supabase
const result = await submitGuessAtomic({ gameId, ... });

// NEW: Convex
const submitGuess = useMutation(api.mutations.game.submitGuessAndCompleteTurn);
const result = await submitGuess({ gameId, ... });
```

### Type Mappings

| Supabase           | Convex                              |
| ------------------ | ----------------------------------- |
| `GameWithPlayers`  | `Doc<"games">` + `Doc<"players">[]` |
| `Player`           | `Doc<"players">`                    |
| `User` (Auth)      | Result of `useAuthenticatedUser()`  |
| `status: "active"` | `status: "started"`                 |

### Schema Changes

| Field       | Changed      | Notes                               |
| ----------- | ------------ | ----------------------------------- |
| max_players | ❌ Removed   | Use max_rounds instead              |
| timer_end   | ⚠️ Different | Still exists, timestamp format same |
| game status | ✅ Updated   | "active" → "started"                |

## 🚀 Next Steps (Priority Order)

1. **CRITICAL**: Refactor GameBoard

   - Migrate 5 Supabase mutations to 5 Convex mutations
   - Update timer logic to work with Convex timestamps
   - Test atomic turn completion

2. **HIGH**: Update GameOver component

   - Display final scores and winner
   - Use Convex queries for leaderboard

3. **MEDIUM**: Drawing storage

   - Verify `captureAndUploadDrawing` works with Convex
   - May need storage action wrapper

4. **LOW**: Minor component adjustments
   - Timer component (mostly compatible)
   - PlayerList rendering updates

## 📊 Completion Status

```
Phase 1: COMPLETE ✅
├── Schema design ✅
├── Auth integration ✅
├── Mutations ✅
├── Queries ✅
└── Actions ✅

Phase 2: 65% COMPLETE ⏳
├── Forms: 100% ✅
├── Pages: 100% ✅
├── Display Components: 75% ✅
├── History Page: 100% ✅
├── GameBoard: 0% ⏳
├── GameOver: 0% ❌
└── Minor components: 50% ✅

Phase 3: NOT STARTED ❌
├── Phase 2 optimization
├── E2E testing
└── Performance benchmarking
```

## 📝 Files Modified in Phase 2

- ✅ app/gioca/CreateGameForm.tsx
- ✅ app/gioca/JoinGameForm.tsx
- ✅ app/gioca/page.tsx
- ✅ app/game/[code]/page.tsx
- ✅ app/game/[code]/GameClientPage.tsx
- ✅ app/profile/page.tsx
- ✅ app/profile/ProfileContent.tsx
- ✅ app/history/page.tsx
- ✅ components/game/game-lobby.tsx
- ✅ components/history/game-history-card.tsx
- ✅ components/history/history-filters.tsx
- ✅ convex/schema.ts (added index)
- ✅ convex/queries/history.ts (new file)
- ⏳ components/game/game-board.tsx (PENDING)
- ❌ components/game/game-over.tsx (NOT STARTED)
- ❌ app/history/actions.ts (can be removed)

## 🎯 Success Criteria

- [ ] All game forms working with Convex
- [ ] All pages converted to client components
- [ ] GameBoard component updated with Convex mutations
- [ ] GameOver component displaying results
- [ ] Full E2E game flow working (create → join → play → complete)
- [ ] No Supabase imports in active components
- [ ] Type safety maintained throughout
