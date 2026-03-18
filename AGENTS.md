# Copilot Instructions for PictionAI

Use this repo’s existing conventions and keep changes focused. The app is a real-time multiplayer Pictionary-style game built with Next.js, React, TypeScript, Tailwind CSS, and Convex. Convex is the backend for all data, auth, mutations, queries, actions, and storage. Do not introduce Supabase references or patterns.

## Essentials

- Prefer the existing app structure under `app/`, `components/`, `convex/`, `hooks/`, and `lib/`.
- Use Convex function references from `convex/_generated/api`, with validators on every function.
- Treat queries as read-only and mutations as transactional writes.
- Use `Id<"tableName">` and the generated Convex types for database IDs and docs.
- Keep interactive React components as client components only when they need hooks or browser APIs.
- Prefer Tailwind utilities in JSX and OKLCH colors in CSS files.
- Follow the project’s auth flow and user profile model in the extended `users` table.

## Run And Verify

- Start Convex with `npx convex dev`.
- Start the frontend with `npm run dev`.
- Build with `npm run build`.
- Lint with `npm run lint`.

## Good References

- [README.md](README.md) for setup, architecture, and workflow.
- [TURN_MANAGEMENT_ANALYSIS.md](TURN_MANAGEMENT_ANALYSIS.md) for turn logic and scoring.
- [convex/README.md](convex/README.md) for backend-specific guidance.

## Basic Rules

- Keep mutations atomic and permission checks close to the write.
- Use real-time Convex hooks for live game state.
- Avoid duplicating deep implementation guidance here; link to the source docs instead.
