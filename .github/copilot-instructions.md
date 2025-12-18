# Copilot Instructions for PictionAI Game

## Project Overview

**PictionAI** is a real-time multiplayer Pictionary-style game where players take turns drawing and guessing. The project uses **Convex** as the backend (NOT Supabase), with AI-powered features for card generation and guess validation.

### Tech Stack

- **Frontend**: Next.js 16.0.10 (App Router), React 19.2.3, TypeScript 5.9.3
- **Backend**: Convex 1.31.0 (real-time database, mutations, queries, actions)
- **Auth**: @convex-dev/auth 0.0.90 (built-in Convex authentication)
- **AI**: @ai-sdk/groq with Vercel AI SDK for card generation
- **Styling**: Tailwind CSS 4.1.18 (use OKLCH colors in CSS, Tailwind utilities in code)
- **UI Components**: Radix UI primitives, custom components in `components/ui/`
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
  api.actions.uploadDrawing.uploadDrawingScreenshot
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
- **Structured Output**: Uses `generateObject` with Zod schema

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

## Additional Resources

- Convex docs: https://docs.convex.dev
- Convex instructions: `.github/instructions/convex.instructions.md`
