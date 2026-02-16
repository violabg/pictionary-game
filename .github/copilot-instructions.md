# Copilot Instructions for PictionAI Game

## Project Overview

**PictionAI** is a real-time multiplayer Pictionary-style game where players take turns drawing and guessing. The project uses **Convex** as the backend (NOT Supabase), with AI-powered features for card generation and guess validation.

### Tech Stack

- **Frontend**: Next.js 16.0.10 (App Router), React 19.2.3, TypeScript 5.9.3
- **Backend**: Convex 1.31.0 (real-time database, mutations, queries, actions)
- **Auth**: @convex-dev/auth 0.0.90 (built-in Convex authentication)
- **AI**: @ai-sdk/groq with Vercel AI SDK for card generation
- **Styling**: Tailwind CSS 4.1.18 (use OKLCH colors in CSS, Tailwind utilities in code)
- **UI Components**: Base UI primitives, custom components in `components/ui/`
- **Forms**: react-hook-form 7.68.0 + @hookform/resolvers + Zod 4.2.1

## Architecture

### Backend: Convex (NOT Supabase)

**Critical**: This project uses **Convex**, not Supabase. Do NOT reference Supabase APIs.

- **Convex Functions**: All backend logic is in `convex/` directory
  - `queries/` - Read-only operations (useQuery hook)
  - `mutations/` - Write operations (useMutation hook)
  - `actions/` - External API calls, Node.js operations (useAction hook)
- **Real-time**: Convex provides automatic real-time subscriptions
- **File Storage**: Convex built-in storage for drawings (`_storage` table)
- **Function Syntax**: Use new function syntax with validators:

```typescript
export const myQuery = query({
  args: { game_id: v.id("games") },
  returns: v.object({ ... }),
  handler: async (ctx, args) => { ... },
});
```

### Database Schema (`convex/schema.ts`)

Key tables: `users`, `games`, `players`, `cards`, `turns`, `guesses`, `drawings`

- Use `Id<"tableName">` for type-safe IDs
- Always define indexes with descriptive names (e.g., `by_game_and_player`)
- System fields: `_id`, `_creationTime` auto-generated
- `users` table extends Convex Auth's `authTables` with `username`, `total_score`, `games_played`

### Turn-Based Game Flow

**Atomic Turn System** (see `TURN_MANAGEMENT_ANALYSIS.md`):

1. **Start Turn**: Drawer calls `startNewTurn` mutation
2. **Drawing Phase**: Real-time canvas strokes, 60-120 second timer
3. **Guess Submission**: Players call `submitGuessAndCompleteTurn` mutation
4. **Turn Completion**: Three scenarios handled atomically:
   - Correct guess → Both guesser and drawer earn points
   - Manual winner selection → Drawer chooses winner
   - Time up → No points, advance to next turn
5. **Score Updates**: Dual scoring (guesser gets time bonus, drawer gets 25% + min 10 points)
6. **Next Turn**: Automatic round-robin rotation, new card assignment

### Real-time Patterns

Use Convex hooks in React components:

```typescript
const game = useQuery(api.queries.games.getGame, { game_id });
const startTurn = useMutation(api.mutations.game.startNewTurn);
const uploadDrawing = useAction(
  api.actions.uploadDrawing.uploadDrawingScreenshot,
);
```

## Development Workflows

### Running the Project

```bash
# Terminal 1: Start Convex backend
npx convex dev

# Terminal 2: Start Next.js frontend
npm run dev
```

Access at `http://localhost:3000`. Convex dashboard at URL shown in Terminal 1.

### Key Scripts

- `npm run dev` - Start Next.js dev server
- `npx convex dev` - Start Convex backend with live code push
- `npm run build` - Production build
- `npm run lint` - ESLint check

### Testing

Follow `TESTING_GUIDE.md` for comprehensive test scenarios covering auth, game creation, lobby, drawing, guessing, scoring, and turn management.

## Code Conventions

### Styling

- **Colors**: Use OKLCH format in CSS files (`oklch(0.7 0.1 200)`), Tailwind utilities in JSX (`bg-blue-500`)
- **Utilities**: Prefer Tailwind classes, avoid inline styles
- **Dark Mode**: Use `dark:` prefix, theme managed by `next-themes`

### React Components

- **Functional components** with TypeScript
- **Client components**: Add `"use client"` for hooks/interactivity
- **Server components**: Default in Next.js App Router
- **Arrow functions** for component definitions and handlers

### Forms & Validation

- **Zod schemas** for all form validation
- **React Hook Form** with `@hookform/resolvers/zod`
- Example:

```typescript
const formSchema = z.object({ email: v.string().email() });
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
});
```

### Convex Patterns

- **Function references**: Use `api.mutations.game.startNewTurn` (NOT direct imports)
- **Type safety**: Import `Id`, `Doc` from `convex/_generated/dataModel`
- **Validators**: Always include `args` and `returns` validators
- **Internal functions**: Use `internalMutation`, `internalQuery`, `internalAction` for private functions
- **Atomic operations**: Database operations in mutations are transactional

### Authentication

- **@convex-dev/auth**: Built-in Convex authentication
- **Auth Provider**: Wrap app in `ConvexAuthNextjsProvider` (see `app/layout.tsx`)
- **User Initialization**: User profile fields (`username`, `total_score`, `games_played`) initialized during signup via `initializeUserProfile` mutation
- **Current User**: Use `useAuthenticatedUser()` hook from `hooks/useAuth.ts`

```typescript
const { profile } = useAuthenticatedUser();
// profile contains: user_id, username, email, avatar_url, total_score, games_played
// Note: profile data now comes from users table, not separate profiles table
```

## AI Integration

### Card Generation (`convex/actions/generateCards.ts`)

- **AI Provider**: Groq with Vercel AI SDK
- **Fallback**: Hardcoded card library per category
- **Models**: Tries multiple models, falls back if quota exceeded
- **Structured Output**: Uses `generateText` with Zod schema

### Guess Validation (In Development)

- Planned: AI-powered fuzzy matching for guesses
- Current: String comparison with card word/description

## Project-Specific Notes

### Drawing Canvas (`components/game/drawing-canvas.tsx`)

- **Strokes**: Array of points with color, size, timestamp
- **Tools**: Brush, eraser, color picker, size slider, undo, clear
- **Export**: `captureAndUploadDrawing` utility captures canvas as PNG, uploads to Convex storage

### Game States

- **waiting** → Game created, players joining in lobby
- **started** → Game in progress, turns rotating
- **finished** → All rounds complete, show winner

### Turn States

- **drawing** → Active turn, timer counting
- **completed** → Turn finished with correct guess
- **time_up** → Timer expired, no winner

### Important Files

- `convex/mutations/game.ts` - Core game logic (submit guess, complete turn, start turn)
- `components/game/game-board.tsx` - Main game UI, orchestrates drawing/guessing
- `convex/schema.ts` - Database schema with all table definitions
- `convex/queries/profiles.ts` - User profile queries (uses users table)
- `convex/auth.ts` - Authentication and user initialization
- `.github/instructions/convex.instructions.md` - Comprehensive Convex guidelines

## Common Pitfalls

1. **Don't confuse Supabase with Convex** - This project uses Convex exclusively
2. **Don't mutate in queries** - Use mutations for writes, queries are read-only
3. **Don't use `ctx.db` in actions** - Actions can't access database directly, use `ctx.runQuery`/`ctx.runMutation`
4. **Don't skip validators** - Always define `args` and `returns` in Convex functions
5. **Don't use relative paths for IDs** - Use `Id<"tableName">` type from generated types
6. **Follow file-based routing** - Convex functions organized by file path (e.g., `api.queries.games.getGame` → `convex/queries/games.ts`)
7. **Use users table for profiles** - The separate profiles table has been removed; all user data is in the extended users table

## Common Development Patterns

### Adding a New Game Feature

**Example: Add a "pause game" button**

1. **Backend - Convex Mutation** (`convex/mutations/game.ts`):

```typescript
export const pauseGame = mutation({
  args: { game_id: v.id("games") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const game = await ctx.db.get(args.game_id);
    if (game?.created_by !== userId) throw new Error("Not authorized");

    await ctx.db.patch(args.game_id, { status: "paused" });
    return null;
  },
});
```

2. **Frontend - UI Component** (`components/game/game-header.tsx`):

```typescript
"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export const GameHeader = ({ gameId }) => {
  const pauseGame = useMutation(api.mutations.game.pauseGame);

  return (
    <Button onClick={() => pauseGame({ game_id: gameId })}>
      Pause Game
    </Button>
  );
};
```

3. **Update schema** if new fields needed in `convex/schema.ts`

### Creating a Real-time Query

```typescript
// convex/queries/games.ts
export const getGame = query({
  args: { game_id: v.id("games") },
  returns: GameDoc, // Type-safe return
  handler: async (ctx, args) => {
    return await ctx.db.get(args.game_id);
  },
});

// In component - auto-updates when game changes
const game = useQuery(api.queries.games.getGame, { game_id });
```

### Handling Permissions

Centralize permission checks in `convex/lib/permissions.ts`:

```typescript
export async function canGuess(
  ctx: QueryCtx,
  gameId: Id<"games">,
  userId: string,
): Promise<boolean> {
  const game = await ctx.db.get(gameId);
  return game?.current_drawer_id !== userId;
}
```

Then use in mutations:

```typescript
const canGuessResult = await canGuess(ctx, args.game_id, userId);
if (!canGuessResult) throw new Error("Not authorized to guess");
```

### Atomic Multi-step Operations

Keep related operations in a single mutation to prevent races:

```typescript
// GOOD: All in one mutation
export const submitGuessAndCompleteTurn = mutation({
  args: { game_id, turn_id, guess_text },
  handler: async (ctx, args) => {
    // 1. Record guess
    // 2. Check if correct
    // 3. Award points
    // 4. Update turn status
    // All atomic - either all succeed or all fail
  },
});

// BAD: Split across multiple mutations (race condition risk)
// Don't do this:
await submitGuess({ ... });
await awardPoints({ ... });
await updateTurnStatus({ ... });
```

## Debugging & Troubleshooting

### Verify Convex Backend is Running

```bash
# Terminal check
npx convex dev

# Expected output shows:
# Convex dev server is ready!
# Add the following to your .env.local file:
# VITE_CONVEX_URL=https://pink-gazelle-123.convex.cloud
```

**If not running**: Components using `useQuery`/`useMutation` will show loading state indefinitely.

### Common Error Patterns

| Error                            | Cause                                       | Fix                                                                                       |
| -------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| "Game not found"                 | Querying with wrong game ID or deleted game | Verify ID is correct `Id<"games">` type                                                   |
| "Cannot call ctx.db in action"   | Accessing database in action function       | Use `ctx.runQuery()` or `ctx.runMutation()` instead                                       |
| "Unauthorized"                   | Missing or invalid auth token               | Ensure `ConvexAuthNextjsProvider` wraps app; check `.env.local`                           |
| Type errors on `api.mutations.*` | Convex generated types are stale            | Run `npx convex dev` to regenerate `convex/_generated/`                                   |
| "Function not found"             | Missing or incorrect function path          | Check file-based routing: `convex/queries/games.ts:getGame` → `api.queries.games.getGame` |
| Real-time data not updating      | Query skip condition blocking subscription  | Verify query args aren't "skip"; check Convex dashboard logs                              |

### Debugging Real-time Subscriptions

```typescript
// Enable verbose logging
const game = useQuery(api.queries.games.getGame, { game_id: gameId });

// In browser console
console.log("Game data:", game); // undefined = loading, null = not found

// Check Convex dashboard
// Dashboard URL shown in `npx convex dev` output
// > Logs tab shows all function executions
// > Data tab shows live database contents
```

### Canvas Drawing Issues

- **Canvas not responding**: Ensure `DrawingCanvas` component has `"use client"` directive
- **Strokes not saving**: Check `convex/actions/uploadDrawing.ts` execution in Convex dashboard
- **Drawing lost on refresh**: Verify `saveTurnStrokes` mutation completed before page unload

### Performance

- **Slow queries**: Check indexes in `convex/schema.ts` - queries without indexes scan entire table
- **Many re-renders**: Use `useCallback` in game-board.tsx to memoize mutation handlers
- **High latency**: Reduce query scope - subscribe to specific game, not all games

## Testing Strategy

Since the project doesn't currently have an automated test framework, follow these manual testing workflows:

### Manual Test Checklist by Feature

**Authentication**

- [ ] Sign up with valid credentials → User created, redirected to home
- [ ] Sign up with duplicate email → Error shown
- [ ] Login with correct password → Success, redirected
- [ ] Forgot password flow → Email sent (check logs if local)
- [ ] Password update changes auth → Can login with new password

**Game Creation & Joining**

- [ ] Create game with category → Game code generated, player is host
- [ ] Join game with code → Player appears in lobby
- [ ] Start game with 1 player → Game starts (or error if min players required)
- [ ] Start game twice → Second attempt fails (status already "started")

**Game Play - Drawing Phase**

- [ ] First stroke starts timer → Timer countdown visible
- [ ] Drawing tools work → Color, size, eraser functional
- [ ] Undo works → Last stroke removed
- [ ] Canvas clears → All strokes removed

**Game Play - Guessing Phase**

- [ ] Drawer cannot guess → Input disabled or error
- [ ] Other players can guess → Guess submitted, appears in feed
- [ ] Correct guess → Player scores, turn ends, next drawer assigned
- [ ] Fuzzy match activated → Similar words accepted
- [ ] Multiple correct guesses → Only first guesser scores

**Scoring**

- [ ] Guesser gets time bonus → Points = timeRemaining seconds
- [ ] Drawer gets 25% + min 10 → Points = max(10, floor(timeRemaining/4))
- [ ] Time up, no correct guess → No points awarded
- [ ] Round over → Scores accumulated on player rows
- [ ] Game over → Scores synced to user `total_score`

**Turn Rotation**

- [ ] Drawer rotates round-robin → Each player draws once per round
- [ ] Round advances on completion → `game.round` increments
- [ ] Game finishes at max_rounds → Status changes to "finished"

**Real-time Sync**

- [ ] Two players in same game → Both see same state
- [ ] Player joins mid-game → Sees current turn and score
- [ ] Drawing appears live → Others see strokes in real-time
- [ ] Scores update instantly → No page refresh needed

### Testing Tools

- **Convex Dashboard** (shown in `npx convex dev` output):
  - Live database viewer
  - Function execution logs
  - Query subscriptions monitor
- **Browser DevTools**:
  - Console logs from components
  - Network tab for API calls
  - React DevTools for component state

- **Multiple Browsers**: Open localhost:3000 in two tabs/windows to test multiplayer

### When to Add Automated Tests

If adding automated testing framework (Jest/Vitest recommended):

1. Test Convex mutations in isolation (complex logic paths)
2. Test permission checks (authorization)
3. Test scoring calculations
4. Test form validation (Zod schemas)
5. Component snapshot tests (UI layout stability)

Not worth automating:

- Real-time multiplayer synchronization (relies on Convex backend)
- Auth flows (defer to @convex-dev/auth)
- Simple render tests (high maintenance, low value)

## Directory Organization & Exemplary Files

### File Structure Best Practices

```
app/                          # Next.js App Router pages
├── layout.tsx               # Root layout with providers (AuthProvider, ThemeProvider, ConvexProvider)
├── page.tsx                 # Home page / lobby selector
├── auth/
│   ├── login/page.tsx      # Login page (server component)
│   ├── sign-up/page.tsx    # Signup page (server component)
│   └── ...                 # Password recovery, etc.
├── game/[code]/            # Dynamic game route
│   └── page.tsx            # Game page (fetches game by code)
└── profile/page.tsx        # User profile & stats

components/                  # Reusable React components
├── ui/                     # Base UI primitives (shadcn-style)
│   ├── button.tsx          # Base button
│   ├── input.tsx           # Base input
│   ├── card.tsx            # Base card layout
│   └── ...
├── auth/                   # Authentication components
│   ├── login-form.tsx      # Login form with Zod validation
│   ├── sign-up-form.tsx    # Signup form with Zod validation
│   └── current-user-avatar.tsx  # User profile avatar
├── game/                   # Game-specific components (all need "use client")
│   ├── game-board.tsx      # Main game orchestrator (uses all hooks)
│   ├── drawing-canvas.tsx  # Canvas component (handles strokes, tools)
│   ├── guess-input.tsx     # Input for player guesses
│   ├── guess-feed.tsx      # Live guess history
│   ├── player-list.tsx     # Sidebar with scores
│   ├── timer.tsx           # Countdown timer
│   ├── game-over.tsx       # Results screen
│   └── ...
└── layout/
    └── navbar.tsx          # Top navigation (server component wrapper)

convex/                     # Backend functions and schema
├── schema.ts              # Database schema (tables, indexes, validators)
├── auth.ts                # Auth configuration & user initialization
├── http.ts                # HTTP endpoints if needed
├── queries/               # Read-only operations
│   ├── games.ts          # getGame, listGames, etc.
│   ├── players.ts        # getGamePlayers, etc.
│   ├── turns.ts          # getCurrentTurn, etc.
│   ├── cards.ts          # getCurrentCard, etc.
│   └── profiles.ts       # getCurrentUserProfile, etc.
├── mutations/             # Write operations
│   ├── game.ts           # submitGuessAndCompleteTurn, startNewTurn, etc.
│   ├── drawings.ts       # saveTurnStrokes, etc.
│   └── auth.ts           # initializeUserProfile, etc.
├── actions/               # External API calls
│   ├── generateCards.ts  # AI card generation with Groq
│   ├── uploadDrawing.ts  # Upload screenshot to storage
│   └── validateGuess.ts  # Fuzzy match validation
├── lib/                   # Helper functions
│   ├── permissions.ts    # canGuess, canStartTurn, etc.
│   └── scoring.ts        # calculateScore, etc.
└── _generated/            # Auto-generated types (never edit)
    ├── api.ts            # Function references
    └── dataModel.ts      # Type-safe IDs and Docs

hooks/                      # Custom React hooks
├── useAuth.ts            # useAuthenticatedUser() hook
├── useTurnTimer.ts       # Turn countdown timer logic
├── useDrawerTurnActions.ts # Drawer-specific actions
└── useConvexSubscriptions.ts # Custom subscription patterns

lib/                        # Utilities
├── utils.ts              # General utilities (cn for tailwind merge, etc.)
├── groq.ts               # Groq AI client setup
└── convex/               # Convex helper utilities

styles/                     # Global styles
└── globals.css           # Tailwind directives, OKLCH color vars

skills/                     # Copilot skill files (documentation)
├── convex-ai-card-generation/
├── convex-authentication/
├── convex-game-management/
└── ...
```

### Exemplary Files (Follow These Patterns)

| File                               | Why It's Good                                                           |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `convex/mutations/game.ts`         | Atomic mutations, permission checks, transaction safety                 |
| `components/game/game-board.tsx`   | Complex state orchestration, proper hook usage, real-time subscriptions |
| `components/auth/sign-up-form.tsx` | Zod validation, react-hook-form integration, async form handling        |
| `hooks/useAuth.ts`                 | Simple, focused hook with clear return interface                        |
| `convex/schema.ts`                 | Complete schema with types, indexes, validators                         |
| `app/layout.tsx`                   | Proper provider wrapping order (Auth → Convex → Theme → Content)        |

### When Adding a New Feature

1. **Check similar patterns** in exemplary files first
2. **Keep mutations small and atomic** (one responsibility each)
3. **Centralize shared logic** (helpers in `convex/lib/`, hooks in `hooks/`)
4. **Type everything** (use `Id<"tableName">`, `Doc` types)
5. **Add index** if querying by new field in `convex/schema.ts`
6. **Test manually** following testing checklist above

## Additional Resources

- Convex docs: https://docs.convex.dev
- Convex instructions: `.github/instructions/convex.instructions.md`
- Turn system deep-dive: `TURN_MANAGEMENT_ANALYSIS.md`
- React documentation: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
