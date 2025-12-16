# Plan: Supabase to Convex Migration (Final)

**TL;DR**: Migrate pictionary game from Supabase to Convex with atomic mutations for turn completion, individual subscriptions phased to compound queries, Convex Auth with GitHub OAuth, permission utility helpers, Convex Actions for Groq card generation, JSON canvas data in Convex schema, and Convex file storage for drawings. Sequential migration: auth → game logic → UI components.

## Steps

1. **Initialize Convex project** – Set up `convex/` folder, install dependencies, configure Convex Auth with GitHub OAuth secrets and Groq API key as environment variable

2. **Define Convex schema** – Create `convex/schema.ts` with 7 tables (profiles, games, players, cards, guesses, drawings, turns), including JSON canvas data in drawings table and indexes for performance

3. **Create permission utilities** – Build `convex/lib/permissions.ts` with reusable auth helpers: `requireAuth()`, `isGameHost()`, `isGamePlayer()`, `canGuess()` for mutation-level RLS logic

4. **Set up Convex Auth + GitHub OAuth** – Configure `convex/auth.ts` and `convex/auth.config.ts` with Convex Auth provider, auto-create profile on signup via trigger equivalent

5. **Implement Convex Actions for card generation** – Create `convex/actions/generateCards.ts` that calls Groq API and stores cards atomically, replacing client-side `lib/groq.ts` calls

6. **Build atomic game mutations** – Write `convex/mutations/game.ts` with: `submitGuessAndCompleteTurn()`, `completeGameTurnManualWinner()`, `completeGameTurnTimeUp()` using permission helpers

7. **Create data access layer** – Build query and mutation files organized by domain: `convex/mutations/games.ts`, `convex/mutations/players.ts`, `convex/queries/games.ts`, `convex/queries/turns.ts`, etc.

8. **Set up Convex file storage** – Configure Convex file storage for game drawings, replace Supabase Storage bucket with `convex/actions/uploadDrawing.ts` that stores PNG screenshots

9. **Create Convex client & auth hook** – Replace `lib/supabase/` with `lib/convex/client.ts` and `hooks/useAuth.ts` using Convex useAuth + useQuery hooks

10. **Migrate authentication routes** – Update `app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx`, remove `app/auth/oauth/route.ts`, update middleware to use Convex session

11. **Implement Phase 1 subscriptions** – Create individual subscription hooks in `hooks/` directory: `useGameState.ts`, `useGamePlayers.ts`, `useGameGuesses.ts`, `useTurnsHistory.ts` using Convex useQuery + polling

12. **Update game components** – Replace Supabase calls in `components/game/` (board, lobby, guess-input, timer, player-list) with Convex query/mutation calls and new subscription hooks

13. **Update main app pages** – Replace Supabase calls in `app/game/[code]/page.tsx`, `app/gioca/page.tsx`, `app/history/page.tsx`, `app/profile/page.tsx` with Convex queries

14. **Phase 2 optimization** – Post-v1: Create `convex/queries/compound.ts` with `getGameStateWithPlayers()`, `getActiveGameData()` and consolidate subscriptions

15. **Test, validate, and deploy** – E2E testing with Convex, performance benchmarking, production deployment

## Implementation Details by Decision

### 🔐 Atomic Transactions (Recommend: Single Mutation)

- **Where**: `convex/mutations/game.ts` - `submitGuessAndCompleteTurn()` combines:
  - Insert guess record
  - Validate correctness (exact + AI fuzzy match via Groq)
  - If correct: update player scores, create turn, mark card used, rotate drawer, get next card
  - All in single mutation → Convex auto-rolls back on error
- **Error safety**: Race condition prevented by mutation atomicity, no separate transaction needed
- **Return value**: Includes guess result + new game state for UI update

### 🔄 Real-time Subscriptions (Recommend: Phase 1 Individual → Phase 2 Compound)

- **Phase 1 hooks** (using Convex `useQuery` + polling):
  - `hooks/useGameState.ts` → `useQuery(api.queries.games.getGameState, { gameId })`
  - `hooks/useGamePlayers.ts` → `useQuery(api.queries.players.getGamePlayers, { gameId })`
  - `hooks/useGameGuesses.ts` → `useQuery(api.queries.guesses.getGameGuesses, { gameId })`
  - `hooks/useTurnsHistory.ts` → `useQuery(api.queries.turns.getTurns, { gameId, limit: 50 })`
- **Phase 2** (post-v1 optimization):
  - Create `convex/queries/compound.ts`
  - `getActiveGameData()` → single query returning game + players + guesses + current card + recent turns
  - Replace 4 individual hooks with 1 subscription
  - Reduces DB queries and network roundtrips

### 🎯 Schema Type Safety (Recommend: Option A - Regenerate)

- **Auto-generated types**: Use Convex's generated types from `convex/_generated/api.d.ts`
- **Component props**: Update all component props files to use generated types (e.g., `Player`, `Game`, `Turn`)
- **No wrapper layer**: Direct usage of Convex schema types in React components
- **Benefits**: Full IDE autocomplete, prevents type sync bugs, enforces schema contracts

### 🔒 Permission Utilities (Recommend: Option B - Helper Functions)

- **Location**: `convex/lib/permissions.ts`
- **Helper functions**:

  ```typescript
  export const requireAuth = (ctx: QueryCtx | MutationCtx): string => {
    const identity = ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return identity.subject;
  };

  export const isGameHost = async (
    ctx: QueryCtx,
    gameId: Id<"games">,
    userId: string
  ) => {
    const game = await ctx.db.get(gameId);
    return game.created_by === userId;
  };

  export const isGamePlayer = async (
    ctx: QueryCtx,
    gameId: Id<"games">,
    userId: string
  ) => {
    const player = await ctx.db
      .query("players")
      .filter((q) =>
        q.eq(q.field("game_id"), gameId).and(q.eq(q.field("player_id"), userId))
      )
      .first();
    return player !== null;
  };

  export const canGuess = async (
    ctx: QueryCtx,
    gameId: Id<"games">,
    userId: string
  ) => {
    const game = await ctx.db.get(gameId);
    return game.current_drawer_id !== userId;
  };
  ```

- **Used in every mutation**: E.g., `submitGuessAndCompleteTurn()` starts with:
  ```typescript
  const userId = requireAuth(ctx);
  if (!(await canGuess(ctx, gameId, userId))) throw new Error("Cannot guess");
  ```
- **Audit benefit**: Central permission logic for security review

### 🔑 OAuth & Sessions (Recommend: Option B - Convex Auth)

- **No custom OAuth route**: Remove `app/auth/oauth/route.ts`, `app/auth/confirm/route.ts`
- **Convex Auth config** `convex/auth.config.ts`:
  - GitHub OAuth provider setup
  - Automatic session management
  - Callback handled internally by Convex
- **Sign-up**: User authenticates → Convex Auth creates user → mutation creates profile record
- **Session**: Available via `useAuth()` hook from Convex, no cookie middleware needed
- **Benefit**: 2 fewer custom routes, smaller attack surface, built-in token refresh

### 🎨 Groq AI Card Generation (Recommend: Option B - Convex Action)

- **Location**: `convex/actions/generateCards.ts`
- **Why Action**: Groq API calls can be slow (1-3 sec), Actions run server-side without blocking client
- **Called from**: `createGame()` mutation in `convex/mutations/games.ts` via `ctx.runAction()`
- **Flow**:
  1. User creates game → `createGame()` mutation triggered
  2. Mutation calls `ctx.runAction(api.actions.generateCards, { category, count: 8 })`
  3. Action makes Groq API call, returns 8 cards with descriptions
  4. Mutation inserts cards, returns game ready to start
- **Error handling**: If API fails, user sees error, can retry

### 📄 Canvas Data Storage (Recommend: Option A - JSON in Convex)

- **Schema in `convex/schema.ts`**:
  ```typescript
  drawings: defineTable({
    game_id: v.id("games"),
    card_id: v.id("cards"),
    drawer_id: v.id("profiles"),
    canvas_data: v.object({
      // Store JSON strokes directly
      strokes: v.array(
        v.object({
          x: v.number(),
          y: v.number(),
          color: v.string(),
          size: v.number(),
          timestamp: v.number(),
        })
      ),
      width: v.number(),
      height: v.number(),
    }),
    turn_id: v.id("turns"),
    created_at: v.number(),
  });
  ```
- **File storage** (separate): PNG screenshot stored in Convex file storage (see next section)
- **Benefit**: Reproducing/replaying drawing possible without re-fetching file

### 🖼️ File Storage (Recommend: Option A - Convex File Storage)

- **Setup**: Convex provides built-in file storage (replaces Supabase Storage bucket)
- **Action**: `convex/actions/uploadDrawing.ts`
  ```typescript
  export const uploadDrawingScreenshot = action({
    args: { gameId: v.id("games"), pngBlob: v.bytes() },
    handler: async (ctx, args) => {
      const storageId = await ctx.storage.store(args.pngBlob);
      // storageId is reference to stored file
      return storageId;
    },
  });
  ```
- **Usage in turn completion**: Call this action, get `storageId`, store in turns table
- **Retrieval**: Use Convex `useQuery` with `getUrl()` to get signed download URL
- **Benefit**: Single provider (Convex), no external bucket dependencies

### ⏱️ Timeline (Recommend: Sequential)

- **Phase 1 (Auth)**: Days 1-3 - Convex Auth, schema, queries/mutations for profiles
- **Phase 2 (Game Logic)**: Days 4-6 - Game CRUD, mutations, card generation action, turn completion
- **Phase 3 (UI)**: Days 7-10 - Update components, hooks, pages
- **Phase 4 (Polish & Optimize)**: Days 11-12 - Phase 2 compound queries, testing, deployment
- **Benefit**: Reduces merge conflicts, allows testing at each stage, easier rollback if needed

## Final File Structure

```
convex/
  ├── auth.ts                           # Convex Auth setup
  ├── auth.config.ts                    # GitHub OAuth config
  ├── schema.ts                         # 7 tables with JSON canvas_data
  ├── lib/
  │   └── permissions.ts                # Auth helpers (requireAuth, isGameHost, etc.)
  ├── mutations/
  │   ├── game.ts                       # Atomic turn completion mutations
  │   ├── games.ts                      # Game CRUD (create, join, delete)
  │   ├── players.ts                    # Player management
  │   ├── cards.ts                      # Card CRUD
  │   ├── guesses.ts                    # Guess submission (calls game.ts mutation)
  │   ├── turns.ts                      # Turn management
  │   └── profiles.ts                   # Profile updates
  ├── queries/
  │   ├── games.ts                      # Get game, list games
  │   ├── players.ts                    # Get game players
  │   ├── cards.ts                      # Get unused cards
  │   ├── guesses.ts                    # Get game guesses
  │   ├── turns.ts                      # Get turns with pagination
  │   ├── profiles.ts                   # Get profile with score
  │   └── compound.ts                   # (Phase 2) Optimized multi-table queries
  ├── actions/
  │   ├── generateCards.ts              # Groq AI card generation
  │   └── uploadDrawing.ts              # Canvas → PNG → file storage
  └── _generated/                       # Auto-generated types & API

lib/
  ├── convex/
  │   └── client.ts                     # Convex client init
  └── utils.ts, hooks/, etc.            # (unchanged)

hooks/
  ├── useAuth.ts                        # Convex Auth hook (new)
  ├── useGameState.ts                   # Game subscription (updated)
  ├── useGamePlayers.ts                 # Players subscription (new)
  ├── useGameGuesses.ts                 # Guesses subscription (new)
  ├── useTurnsHistory.ts                # Turns subscription (new)
  └── useWindowSize.ts                  # (unchanged)

app/
  ├── auth/
  │   ├── login/page.tsx                # Updated for Convex Auth
  │   ├── sign-up/page.tsx              # Updated for Convex Auth
  │   └── (oauth/route.ts REMOVED)
  ├── game/[code]/page.tsx              # Updated for Convex queries
  ├── gioca/page.tsx                    # Updated for Convex mutations
  ├── history/page.tsx                  # Updated for Convex queries + pagination
  └── profile/page.tsx                  # Updated for Convex profile query

components/
  ├── game/                             # All updated to use Convex hooks
  │   ├── game-board.tsx
  │   ├── guess-input.tsx               # Calls submitGuessAndCompleteTurn()
  │   ├── player-list.tsx
  │   └── timer.tsx
  └── (other components updated)
```

## Next Steps

Ready to proceed with **Phase 1: Auth Setup**?

- Initialize Convex in the workspace
- Create schema.ts with profile/auth tables
- Set up Convex Auth with GitHub OAuth
- Create useAuth() hook and auth routes

Or would you like to refine any migration decisions before starting implementation?
