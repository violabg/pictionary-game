# Convex Migration - Quick Reference Guide

## Common Type Imports

```typescript
// From @convex-dev/dataModel
import { Doc, Id } from "@/convex/_generated/dataModel";

// Game doc type
type Game = Doc<"games">;

// Player doc type
type Player = Doc<"players">;

// Card doc type
type Card = Doc<"cards">;

// Game ID type
type GameId = Id<"games">;
```

## Common Query Patterns

### Fetch Game Data

```typescript
const game = useQuery(api.queries.games.getGameById, { game_id: gameId });
```

### Fetch Players

```typescript
const players = useQuery(api.queries.players.getGamePlayers, {
  game_id: gameId,
});
```

### Fetch Current Turn

```typescript
const currentTurn = useQuery(api.queries.turns.getCurrentTurn, {
  game_id: gameId,
});
```

### Fetch Card

```typescript
const card = useQuery(
  api.queries.cards.getCard,
  currentTurn && currentTurn.card_id ? { card_id: currentTurn.card_id } : "skip"
);
```

## Common Mutation Patterns

### Start New Turn

```typescript
const startNewTurn = useMutation(api.mutations.game.startNewTurn);
await startNewTurn({ game_id: gameId });
```

### Submit Guess

```typescript
const submitGuess = useMutation(api.mutations.game.submitGuessAndCompleteTurn);
const result = await submitGuess({
  game_id: gameId,
  turn_id: turnId,
  guess_text: guessText,
});
```

### Complete Turn

```typescript
const completeTurn = useMutation(api.mutations.game.completeGameTurn);
await completeTurn({
  game_id: gameId,
  turn_id: turnId,
  reason: "time_up" | "manual",
});
```

## Authentication

### Get Current User

```typescript
import { useAuthenticatedUser } from "@/lib/hooks/useAuthenticatedUser";

const { profile, isLoading } = useAuthenticatedUser();
// profile has: user_id, username, email, avatar_url, total_score, games_played
```

## Pagination Example

```typescript
const historyData = useQuery(api.queries.history.getUserGameHistory, {
  paginationOpts: { numItems: 10, cursor: null },
  category: selectedCategory, // optional
});

// Access results
const games = historyData?.page ?? [];
const hasMore = !historyData?.isDone ?? false;
const nextCursor = historyData?.continueCursor;
```

## Game Status Values

```typescript
// Game status
type GameStatus = "waiting" | "started" | "finished";

// Turn status
type TurnStatus = "drawing" | "completed" | "time_up";
```

## Field Mappings: Supabase → Convex

### Game Fields

| Supabase           | Convex                 | Notes                |
| ------------------ | ---------------------- | -------------------- |
| `id`               | `_id`                  | Convex uses \_id     |
| `difficulty`       | ❌ Removed             | Not in Convex schema |
| `timer`            | ❌ Use turn time_limit | 60 seconds per turn  |
| `timer_end`        | ❌ Use turn started_at | Calculate end time   |
| `status: "active"` | `status: "started"`    | Status value changed |

### Player Fields

| Supabase            | Convex     | Notes              |
| ------------------- | ---------- | ------------------ |
| `id`                | `_id`      | Use \_id           |
| `profile.full_name` | `username` | Field name changed |
| `profile.name`      | `username` | Single field now   |
| `profile.user_name` | `username` | Single field now   |

### Card Fields

| Supabase     | Convex     | Notes                |
| ------------ | ---------- | -------------------- |
| `title`      | `word`     | Field renamed        |
| `difficulty` | ❌ Removed | Not in Convex schema |

## Error Handling Pattern

```typescript
try {
  const result = await mutation({ ...args });
  if (result.success) {
    toast.success("Success message");
  } else {
    toast.error("Error occurred");
  }
} catch (error) {
  console.error("Error:", error);
  toast.error("Failed to process request", {
    description: error instanceof Error ? error.message : "Unknown error",
  });
}
```

## Component Props Update Pattern

### Old (Supabase)

```typescript
interface MyComponentProps {
  game: GameWithPlayers;
  user: User;
}
```

### New (Convex)

```typescript
import { Doc, Id } from "@/convex/_generated/dataModel";

interface MyComponentProps {
  gameId: Id<"games">;
  code: string;
}

export default function MyComponent({ gameId, code }: MyComponentProps) {
  const game = useQuery(api.queries.games.getGameById, { game_id: gameId });
  const { profile } = useAuthenticatedUser();
  // ...
}
```

## Loading States

```typescript
const game = useQuery(api.queries.games.getGameById, { game_id: gameId });
const { profile, isLoading: authLoading } = useAuthenticatedUser();

if (authLoading || game === undefined) {
  return <LoadingSpinner />;
}

if (!profile) {
  return <NotAuthenticatedError />;
}

if (!game) {
  return <GameNotFoundError />;
}

// Component content
```

## Real-time Subscriptions

Convex queries automatically manage subscriptions via `useQuery`. No manual subscription management needed:

```typescript
// This automatically subscribes to changes and updates in real-time
const game = useQuery(api.queries.games.getGameById, { game_id: gameId });

// When game data changes, component automatically re-renders
```

## Toast Notifications

```typescript
import { toast } from "sonner";

// Success
toast.success("Operation successful!", {
  description: "Additional details here",
});

// Error
toast.error("Operation failed", {
  description: "Reason for failure",
});

// Loading (no auto-dismiss)
const id = toast.loading("Processing...");
// Later...
toast.dismiss(id);
```

## Date/Time Handling

Convex stores timestamps as milliseconds (like JavaScript `Date.now()`):

```typescript
// From Convex (milliseconds)
const startedAt = turn.started_at; // e.g., 1702782400000

// Calculate elapsed time
const now = Date.now();
const elapsedMs = now - startedAt;
const elapsedSeconds = Math.floor(elapsedMs / 1000);

// Format for display
import { format } from "date-fns";
format(new Date(startedAt), "dd/MM/yyyy HH:mm");
```

## File Upload Pattern

```typescript
// Drawing upload (already implemented)
import { captureAndUploadDrawing } from "@/lib/utils/drawing-utils";

const uploadedUrl = await captureAndUploadDrawing(
  gameId.toString(),
  canvasDataUrl
);
```

## Debugging Tips

### Check if query is loading

```typescript
if (game === undefined) {
  // Query is still loading
}

if (game === null) {
  // Query returned null (resource not found)
}
```

### Monitor Convex calls in Network tab

- Look for requests to `/_convex/` endpoint
- Check request/response payloads
- Monitor for authentication errors (403)

### Common Errors

| Error                                   | Cause                         | Solution                           |
| --------------------------------------- | ----------------------------- | ---------------------------------- |
| "You must be authenticated"             | No user logged in             | Check `useAuthenticatedUser()`     |
| "Game not found"                        | Invalid gameId                | Verify gameId format and existence |
| "You cannot guess (you are the drawer)" | Trying to guess while drawing | Check `isDrawer` flag              |
| "Only host can complete turn"           | Non-host trying to end turn   | Verify user is game creator        |

## Migrating Supabase Code to Convex

### 1. Identify the data source

- Supabase query/subscription → Convex query with useQuery

### 2. Replace imports

```typescript
// Remove
import { createClient } from "@/lib/supabase/client";
import { getGame } from "@/lib/supabase/supabase-games";

// Add
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
```

### 3. Replace data fetching

```typescript
// Old
const supabase = createClient();
const { data: game } = await supabase
  .from("games")
  .select()
  .eq("id", gameId)
  .single();

// New
const game = useQuery(api.queries.games.getGameById, { game_id: gameId });
```

### 4. Update types

```typescript
// Old
const game: GameWithPlayers;

// New
const game: Doc<"games"> | undefined;
```

### 5. Handle loading/undefined states

```typescript
// New code must handle undefined (loading state)
if (!game) return <LoadingSpinner />;
```

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [React Hooks](https://docs.convex.dev/client/react)
- [Mutations](https://docs.convex.dev/client/react/use-mutation)
- [Queries](https://docs.convex.dev/client/react/use-query)
