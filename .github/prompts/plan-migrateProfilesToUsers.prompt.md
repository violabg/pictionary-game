# Plan: Migrate Profile Table to Extended Users Table

This plan eliminates the `profiles` table by extending Convex Auth's `users` table with profile fields (`total_score`, `games_played`, `username`, `avatar_url`), refactors all profile queries/mutations to use the `users` table, and removes unused/duplicate code.

## Steps

1. **Update schema** in [convex/schema.ts](convex/schema.ts) - Remove `profiles` table definition, extend `users` table with `total_score`, `games_played` fields per your schema requirement
2. **Create data migration script** - Write `convex/migrations/migrateProfilesToUsers.ts` to copy existing profile data (`total_score`, `games_played`) to corresponding `users` records matching by `user_id`/`_id`
3. **Refactor queries** in [convex/queries/profiles.ts](convex/queries/profiles.ts) - Update `getCurrentUserProfile`, `getProfileByUserId`, `getProfileById`, `getTopPlayers` to query `users` table instead; remove duplicate `getCurrentUserProfile` from [convex/mutations/profile.ts](convex/mutations/profile.ts)
4. **Refactor mutations** - Update [convex/mutations/profile.ts](convex/mutations/profile.ts) (`createProfile`) to work with `users` table; **remove `createOrGetOAuthProfile` function** as it will no longer be needed; update [convex/mutations/game.ts](convex/mutations/game.ts) game creation/join logic to use `users` queries
5. **Remove ProfileInitializer** - Delete [components/auth/profile-initializer.tsx](components/auth/profile-initializer.tsx) component entirely and remove its import from [app/layout.tsx](app/layout.tsx) - profile initialization will be handled directly by Convex Auth's user creation flow
6. **Update UI components** - Refactor [components/auth/current-user-avatar.tsx](components/auth/current-user-avatar.tsx), [hooks/use-current-user-name.ts](hooks/use-current-user-name.ts), [hooks/use-current-user-image.ts](hooks/use-current-user-image.ts), [components/game/player-list.tsx](components/game/player-list.tsx), [app/profile/ProfileContent.tsx](app/profile/ProfileContent.tsx) to use `users` queries
7. **Add leaderboard index** in [convex/schema.ts](convex/schema.ts) - Create `.index("by_total_score", ["total_score"])` on `users` table to optimize `getTopPlayers` query (fix code smell identified in research)
8. **Add leaderboard index** in [convex/schema.ts](convex/schema.ts) - Create `.index("by_total_score_desc", ["total_score"])` on `users` table to optimize `getTopPlayers` query (fix code smell identified in research)
9. **Remove obsolete files** - Delete [setup.sql](setup.sql) (Supabase schema artifact), clean up commented Supabase env vars in [proxy.ts](proxy.ts#L1-L4)
10. **Update documentation** - Revise authentication flow in [.github/copilot-instructions.md](.github/copilot-instructions.md), [convex/README.md](convex/README.md), [TURN_MANAGEMENT_ANALYSIS.md](TURN_MANAGEMENT_ANALYSIS.md) to reflect `users` table usage, remove profile references, document that ProfileInitializer has been removed

## Further Considerations

1. **Migration execution timing** - Should the data migration run automatically via internal mutation on deployment, or manually via Convex dashboard? Automatic ensures seamless transition, manual provides safety check.
2. **Backward compatibility** - Add temporary `@deprecated` comments to old profile functions during transition, or perform atomic cutover? Gradual rollout reduces risk but increases complexity.
3. **Username uniqueness constraint** - Should `username` field have a unique index on `users` table, or allow duplicates? Unique prevents confusion, but requires conflict resolution during migration.
4. **User initialization strategy** - Since ProfileInitializer is being removed, how will we ensure `username`, `total_score`, and `games_played` fields are initialized for new users? Options: (a) Use Convex Auth callbacks to set defaults on user creation, (b) Add null checks and default values in queries, (c) Create a one-time migration to backfill existing users.
5. **Server-side auth token usage** - Do any server components/actions currently need `convexAuthNextjsToken()` from the API reference? Audit [app/api/](app/api/) routes and server actions.

## Research Findings

### Current Profile Table Schema

```typescript
profiles: defineTable({
  user_id: v.string(), // References auth system user ID
  username: v.string(), // Display name
  email: v.string(), // User email
  avatar_url: v.optional(v.string()), // Optional profile picture
  total_score: v.number(), // Cumulative score across games
  games_played: v.number(), // Total games participated in
})
  .index("by_user_id", ["user_id"])
  .index("by_email", ["email"]);
```

### Target Users Table Schema (Extended)

```typescript
users: defineTable({
  // Existing auth fields (from authTables):
  // - email
  // - emailVerificationTime
  // - phone
  // - phoneVerificationTime
  // - image (avatar)
  // - name
  // - isAnonymous

  // New profile fields to add:
  username: v.string(),
  total_score: v.number(),
  games_played: v.number(),
})
  .index("email", ["email"])
  .index("by_total_score", ["total_score"]); // For leaderboard optimization
```

### Files Referencing Profile (To Be Updated)

**Backend:**

- `convex/schema.ts` - Table definition
- `convex/queries/profiles.ts` - All profile queries
- `convex/mutations/profile.ts` - Profile mutations (remove duplicate query)
- `convex/mutations/game.ts` - Game creation/join logic

**Frontend:**

- `hooks/useAuth.ts` - Main auth hook
- `hooks/use-current-user-name.ts` - Username hook
- `hooks/use-current-user-image.ts` - Avatar hook
- `components/auth/profile-initializer.tsx` - Profile auto-creation (**TO BE REMOVED**)
- `components/auth/current-user-avatar.tsx` - Avatar display
- `components/game/player-list.tsx` - Player display
- `app/profile/ProfileContent.tsx` - Profile page
- `app/game/[code]/GameClientPage.tsx` - Game page
- `app/layout.tsx` - Remove ProfileInitializer import

### Code Smells Identified

1. **Duplicate Query Definition** (HIGH) - `getCurrentUserProfile` defined in both `convex/queries/profiles.ts` and `convex/mutations/profile.ts`
2. **Missing Error Handling** (MEDIUM) - ProfileInitializer silently catches errors
3. **Inefficient Leaderboard Query** (MEDIUM) - Client-side sorting after DB query, needs index
4. **Race Condition** (LOW) - Check-then-insert pattern in profile creation
5. **Obsolete Files** - `setup.sql` (Supabase schema), commented env vars in `proxy.ts`

### Authentication Flow

**Current:**

1. User signs up (Password/GitHub)
2. Auth system creates record in `users` table
3. Profile mutation creates corresponding record in `profiles` tab (runs `createOrGetOAuthProfile` mutation)

**Target:**

1. User signs up (Password/GitHub)
2. Auth system creates record in `users` table with extended fields (`username`, `total_score: 0`, `games_played: 0`)
3. No separate profile table needed
4. **ProfileInitializer component removed** - initialization handled by Convex Auth's user creation callbacks or default values in schema
5. ProfileInitializer ensures user record has all required fields

### Convex Auth API for Server-Side

From https://labs.convex.dev/auth/api_reference/nextjs/server:

```typescript
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

// In Server Components, Server Actions, Route Handlers:
const token = await convexAuthNextjsToken();
// Returns token if authenticated, undefined otherwise

// Check authentication status:
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
const isAuth = await isAuthenticatedNextjs();
```

**Usage Note**: Currently no server-side auth usage detected in `app/api/` routes. All authentication is client-side via hooks.
