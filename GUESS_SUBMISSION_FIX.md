# Drawing Capture Fix for Guess Submission Path

## Problem Identified

When players submit guesses via input, the drawing was **not being saved to the database**, while drawings were correctly saved when:

1. Time ran out (timer completion)
2. Drawer manually selected a winner

**Root Cause**: The `submitGuessAndCompleteTurn` mutation immediately marked the turn as `"completed"`, preventing the drawer from capturing the drawing.

## Solution Implemented

### Flow Change: Three-Step Turn Completion for Guesses

**Before (Broken)**:

```
Guess Submitted → submitGuessAndCompleteTurn → Turn marked "completed" → Turn ends (no drawing)
```

**After (Fixed)**:

```
Guess Submitted
  → submitGuessAndCompleteTurn (marks turn "completing")
  → Drawer detects via subscription
  → Drawer captures drawing
  → finalizeTurnCompletion (marks turn "completed" + advances game)
```

### Changes Made

#### 1. `convex/mutations/game.ts`

**Modified `submitGuessAndCompleteTurn`**:

- Now marks turn as `"completing"` instead of `"completed"` when guess is correct
- Records guess and awards points to both guesser and drawer immediately
- **Returns control to client without advancing the game** - lets drawer handle finalization
- If guess is incorrect, reverts turn status back to `"drawing"` to allow more guesses

**New mutation `finalizeTurnCompletion`**:

- Called by drawer after drawing is captured and uploaded
- Only drawer can call this (verified via `turn.drawer_id === userId`)
- Validates turn is in `"completing"` state before proceeding
- Marks turn as `"completed"`
- Advances to next drawer/round, same as `completeGameTurn`

#### 2. `components/game/game-board.tsx`

**Added new mutation hook**:

```typescript
const finalizeTurnCompletionMutation = useMutation(
  api.mutations.game.finalizeTurnCompletion
);
```

**Added new `useEffect` hook** (lines ~280-319):

- Watches for `currentTurn.status === "completing"`
- Triggers only for drawer (`gameState.isDrawer`)
- Automatically:
  1. Calls `captureAndUploadDrawingWithRetry()`
  2. Calls `finalizeTurnCompletionMutation` to complete turn
  3. Shows appropriate toast notifications

**Updated `handleGuessSubmit`**:

- Updated comment to clarify drawing capture happens via subscription
- No functional changes to guesser's code - guesser still just submits guess

### Architecture Benefits

1. **Consistent Drawing Capture**: All three completion paths (guess, time_up, manual_winner) now ensure drawing is captured before turn completes

2. **Atomic Operations**:

   - Drawing upload is atomic (via `saveDrawingStorageId` internal mutation)
   - Turn advancement is atomic (in `finalizeTurnCompletion`)

3. **Race Condition Prevention**:

   - Intermediate `"completing"` status prevents concurrent completions
   - Only drawer can call `finalizeTurnCompletion`
   - Validation checks ensure turn is in expected state

4. **Real-time Responsiveness**:

   - Drawer's client automatically detects correct guess via Convex subscription
   - No polling or manual refresh needed
   - Immediate capture and upload

5. **Error Resilience**:
   - `captureAndUploadDrawingWithRetry` has exponential backoff (3 attempts)
   - Turn completes even if drawing upload fails (logged and warned)
   - Proper error messages shown to users

### Diagram: Turn State Transitions

```
                              ┌─────────────────────────────────────┐
                              │  Turn Created: Status = "drawing"   │
                              └──────────────┬──────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
        ┌─────────────────────┐  ┌────────────────────┐  ┌──────────────────┐
        │  Correct Guess      │  │   Time Runs Out    │  │  Manual Winner    │
        │  Submitted          │  │   (60s Timer)      │  │  Selection        │
        └──────────┬──────────┘  └────────┬───────────┘  └────────┬─────────┘
                   │                      │                       │
                   ▼                      ▼                       ▼
        ┌─────────────────────────────────────────────────────────────────┐
        │  Drawer's Client Detects Event & Captures Drawing               │
        │  - Subscription to turn status/"completing" for correct guess   │
        │  - handleTimeUp() called by timer for time expiration          │
        │  - handleSelectWinner() called by drawer for manual winner     │
        └──────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
        ┌─────────────────────────────────────────────┐
        │  uploadDrawingScreenshot Action             │
        │  - Stores PNG to Convex _storage            │
        │  - Atomically saves storage ID via          │
        │    saveDrawingStorageId internal mutation   │
        └──────────┬──────────────────────────────────┘
                   │
                   ▼
        ┌─────────────────────────────────────────────┐
        │  finalizeTurnCompletion or                  │
        │  completeGameTurn Mutation                  │
        │  - Mark turn "completed"                    │
        │  - Advance to next drawer/round             │
        └──────────┬──────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │  Turn Ends: Status = "completed"     │
        │  (or "time_up" for time expiration)  │
        │  Drawing is now in database!         │
        └──────────────────────────────────────┘
```

## Testing Checklist

- [ ] **Guess Submission Path**: Submit correct guess via input

  - Turn should transition to `"completing"` state
  - Drawer's client should automatically capture drawing
  - Drawing should appear in database (`drawings` table)
  - Turn should complete and advance to next drawer

- [ ] **Time Up Path**: Wait for timer to expire

  - Should work same as before
  - Drawing should be captured and saved
  - Verify no breaking changes

- [ ] **Manual Winner Path**: Drawer selects winner manually

  - Should work same as before
  - Drawing should be captured and saved
  - Verify no breaking changes

- [ ] **Incorrect Guess**: Submit incorrect guess via input

  - Turn status should revert to `"drawing"`
  - Other players should be able to guess again
  - No drawing should be captured

- [ ] **Race Conditions**: Multiple guesses submitted simultaneously
  - Turn status validation should prevent race conditions
  - Only one guess should be marked as correct
  - Drawing should be captured exactly once

## Metrics

- **Files Modified**: 2 (game.ts mutation, game-board.tsx component)
- **New Mutations**: 1 (`finalizeTurnCompletion`)
- **New useEffect Hooks**: 1 (drawer subscription listener)
- **Total Lines Changed**: ~150 (additions + modifications)
- **Backward Compatibility**: ✅ Maintains same timer and manual winner behavior
- **Type Safety**: ✅ Full TypeScript support with validators

## Migration Notes

If upgrading from previous version:

1. **Database**: No schema changes required - already in Phase 1
2. **API**: New mutation `finalizeTurnCompletion` must be available
3. **Client**: Update `game-board.tsx` to use new `finalizeTurnCompletionMutation` hook
4. **Testing**: Run full test suite covering all three turn completion paths

## Phase 2 & 3 Implications

This fix enables:

- **Phase 2**: Draw-to-start timer (can defer `started_at` set until first stroke)
- **Phase 3**: Server-side timer validation (turn completion protected by atomic operations)

The intermediate `"completing"` state pattern established here becomes the foundation for more complex concurrent operations in future phases.
