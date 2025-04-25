# Copilot Instructions

## Project Context

- This project uses Next.js (v15.3.1), React (v19.1.0), and TypeScript (v5.8.3).
- Tailwind CSS is version 4.x. Use only Tailwind v4 features and syntax.
- The following libraries are used:
  - @ai-sdk/groq, @ai-sdk/react, ai
  - @hookform/resolvers, react-hook-form
  - @radix-ui/react-\* (dialog, dropdown-menu, label, popover, select, slot)
  - @supabase/supabase-js
  - class-variance-authority, clsx, lucide-react, next-themes, sonner, tailwind-merge, tw-animate-css, zod

## Styling

- All colors must be specified in OKLCH format (e.g., `oklch(0.7 0.1 200)`).
- Use Tailwind CSS utility classes wherever possible.
- Do not use deprecated or removed Tailwind features from earlier versions.

## General

- Prefer functional React components.
- Use Zod for schema validation.
- Use React Hook Form for form management.
- Use Radix UI components.
- Use Supabase for backend/database interactions.

## Core Gameplay:

- The game is a drawing and guessing game where players take turns drawing a word or phrase while others guess what it is.
- Multiplayer: Support multiple concurrent players in a single game.
- Turns: is a turn-based system where one player draws while the others guess.
- Real-time Drawing: The drawing should be visible to all players (except the drawer's card) in real-time as it's being created. Use Supabase's real-time - capabilities for this.
- Drawer View: The player whose turn it is to draw should be presented with a secret card containing a topic (phrase) to draw.
- Timer: Each drawing turn has a time limit (default to 120 seconds). A countdown timer should be visible to all players.
- Guessing: Players should be able to submit guesses for the drawing.
- Correct Guess: When a player guesses correctly:
- A modal should appear to the drawer.
- The modal should list all players who guessed.
- The drawer selects the player who was the first to guess correctly.
- The selected player is awarded points based on the time remaining on the timer. The point calculation logic should be simple (e.g., points = time_remaining).
- Scoreboard: Maintain and display a scoreboard showing each player's score.
- Turn Rotation: After a correct guess or when the timer expires, the turn should automatically pass to the next player in the rotation.
