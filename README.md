# PictionAI

A real-time multiplayer drawing and guessing game powered by modern web technologies and AI.

## Overview

**PictionAI** combines the timeless fun of Pictionary with real-time multiplayer gameplay. Players take turns drawing while others race to guess the hidden word within the time limit. Built with cutting-edge technologies, the game features AI-powered card generation and real-time synchronization across all players.

### Key Features

- **Real-time Multiplayer**: Instant synchronization of drawings, guesses, and scores across all players
- **AI-Powered Cards**: Intelligent card generation using Groq AI with fallback card library
- **Live Scoring**: Atomic score updates with dual scoring (guesser time bonus + drawer 25% points)
- **Drawing Tools**: Full-featured canvas with brush, eraser, color picker, and undo functionality
- **Game History**: Track your games with statistics and category filters
- **Dark Mode**: Theme support with system preference detection
- **Multiple Languages**: Built with internationalization support (Italian/English)

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn/bun)
- A Convex account (free tier available at [convex.dev](https://convex.dev))

### Installation

```bash
# Clone the repository
git clone https://github.com/violabg/pictionary-game.git
cd pictionary-game

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Running Locally

```bash
# Terminal 1: Start the Convex backend
npx convex dev

# Terminal 2: Start the Next.js frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The Convex dashboard URL will be displayed in Terminal 1.

### Building for Production

```bash
pnpm build
pnpm start
```

## Technology Stack

### Frontend

- **Framework**: Next.js 16.0+ (App Router)
- **React**: 19.2+ with TypeScript
- **Styling**: Tailwind CSS 4.1+ with dark mode support
- **UI Components**: Base UI with custom primitives
- **Forms**: react-hook-form + Zod validation
- **Animations**: Tailwind animations and react-confetti

### Backend

- **Database & Real-time**: [Convex](https://convex.dev) (replaces traditional databases)
- **Authentication**: @convex-dev/auth (built-in Convex authentication)
- **File Storage**: Convex native storage for drawings
- **API Calls**: Convex actions (server-side Node.js operations)

### AI & External Services

- **Card Generation**: @ai-sdk/groq with Vercel AI SDK
- **Fallback**: Hardcoded card library per category

## Project Architecture

### Backend Structure (`convex/`)

The backend uses Convex's type-safe function system:

- **Queries** (`convex/queries/`): Read-only operations with real-time subscriptions
- **Mutations** (`convex/mutations/`): Atomic write operations (game logic, scoring)
- **Actions** (`convex/actions/`): External API calls (AI, file uploads)
- **Schema** (`convex/schema.ts`): Database tables and indexes

Key tables: `users`, `games`, `players`, `cards`, `turns`, `guesses`, `drawings`

### Frontend Structure

- **App Router** (`app/`): Pages for home, auth, game, history, profile
- **Game Board** (`components/game/`): Real-time drawing canvas, guess input, score tracking
- **Auth Components** (`components/auth/`): Login, signup, password recovery
- **UI Library** (`components/ui/`): Reusable Base UI components
- **Custom Hooks** (`hooks/`): Convex subscriptions, auth state, timer management

### Real-time Game Flow

```
Player joins → Game created in "waiting" state
  ↓
Game starts → Players assigned, first drawer selected
  ↓
Drawer begins turn → Canvas opens, 60-120s timer starts
  ↓
Other players guess → Submitted via mutations with atomic validation
  ↓
Correct guess? → Points awarded immediately (time bonus + drawer bonus)
  ↓
Drawing uploaded → Screenshot stored in Convex storage
  ↓
Next turn → Automatic round-robin drawer rotation
```

### Atomic Turn System

The game ensures consistency through Convex mutations:

1. **Turn Creation**: Drawer calls `startNewTurn` (creates turn in "drawing" state)
2. **Guess Submission**: Atomic mutation validates guess and awards points
3. **Turn Completion**: Three scenarios handled atomically:
   - Correct guess → Both players earn points, turn → "completing"
   - Manual winner → Host selects winner, points awarded
   - Time up → No points, timer expires, advance to next turn
4. **Score Persistence**: All scores and turn metadata persisted in single transaction

See [TURN_MANAGEMENT_ANALYSIS.md](TURN_MANAGEMENT_ANALYSIS.md) for detailed turn flow documentation.

## Code Conventions

### TypeScript & React

- Functional components with TypeScript
- `"use client"` directive for interactive components
- Arrow function syntax
- Server components by default in Next.js App Router

### Styling

- Tailwind CSS utilities for layout and responsive design
- OKLCH color format in CSS files
- Dark mode with `dark:` prefix
- Avoid inline styles

### Database & Authentication

- Type-safe Convex function references: `api.mutations.game.startNewTurn`
- Validator schemas for all Convex functions (`args` and `returns`)
- Built-in Convex authentication with user profiles
- User data stored in extended `users` table

### Forms

- Zod schemas for validation
- react-hook-form with `@hookform/resolvers/zod`
- Field validation on submit

## Scoring System

- **Guesser**: `timeLeft` seconds (full time bonus)
- **Drawer**: `max(10, floor(timeLeft / 4))` (25% of time bonus, minimum 10 points)
- **Time up**: No points awarded
- All scores updated atomically in database

## Development Guide

### Adding a New Feature

1. **Backend**:

   - Add table to `convex/schema.ts` if needed
   - Create queries in `convex/queries/`
   - Create mutations in `convex/mutations/`
   - Always include `args` and `returns` validators

2. **Frontend**:

   - Create component in `components/` directory
   - Use `useQuery` for real-time subscriptions
   - Use `useMutation` for writes
   - Add `"use client"` for hooks

3. **Types**:
   - Import from `convex/_generated/dataModel` for `Doc`, `Id`
   - Extend types as needed in feature files

### Common Tasks

**Get current user:**

```typescript
import { useAuthenticatedUser } from "@/hooks/useAuth";
const { profile } = useAuthenticatedUser();
```

**Query real-time data:**

```typescript
import { useQuery } from "convex/react";
const game = useQuery(api.queries.games.getGame, { game_id });
```

**Update database:**

```typescript
import { useMutation } from "convex/react";
const submitGuess = useMutation(api.mutations.game.submitGuess);
await submitGuess({ game_id, guess_text });
```

## Testing

Follow the [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive test scenarios covering:

- Authentication flows
- Game creation and joining
- Lobby state management
- Drawing and guess submission
- Turn rotation and scoring
- Edge cases and concurrency

## Deployment

### Convex Cloud

```bash
# Deploy to Convex Cloud
npx convex deploy
```

### Next.js Hosting

Deploy to any Next.js-compatible platform (Vercel, AWS Amplify, Netlify, etc.):

```bash
pnpm build
# Upload build artifacts to your hosting platform
```

## Troubleshooting

### Convex Connection Issues

- Ensure `npx convex dev` is running in a separate terminal
- Check that `.env.local` contains valid Convex deployment URL
- Clear browser cache and reload

### Canvas Drawing Issues

- Some browsers require HTTPS for canvas operations
- Check browser console for canvas permission errors
- Ensure drawing tools component is mounted with `"use client"`

### AI Card Generation Fails

- Verify Groq API key in Convex environment variables
- Check Convex action logs for quota exceeded errors
- Fallback card library will be used automatically

## Architecture Decisions

### Why Convex?

- **Real-time**: Automatic subscriptions without polling
- **Type Safety**: Generate types from schema automatically
- **Atomic Operations**: All-or-nothing mutations prevent inconsistencies
- **File Storage**: Built-in storage for drawings
- **Developer Experience**: Zero-config authentication, live reload

### Why No Supabase?

This project uses **Convex exclusively** (not Supabase). Convex provides better real-time support, simpler authentication, and atomic operations better suited for multiplayer games.

## Performance Optimization

- Real-time subscriptions scoped to specific game instance
- Avoid re-rendering entire game board on each draw stroke
- Use Convex indexes for efficient queries
- Lazy load game history and profile pages

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

## Support

For issues, questions, or suggestions, please [open an issue](https://github.com/violabg/pictionary-game/issues) on GitHub.

---

Built with ❤️ by the PictionAI team
