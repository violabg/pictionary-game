# Plan: Migrate Turn Management to Convex with Atomic Operations

This plan ensures correct migration from Supabase's atomic turn system to Convex, fixing drawing capture, adding turn winner display, implementing draw-to-start timer, and ensuring concurrency safety.

## Steps

### 1. Refactor turn completion mutations to atomic operations

**File**: `convex/mutations/game.ts`

**Changes**:

- Update `submitGuessAndCompleteTurn` mutation to add drawer scoring (25% + min 10 points)
- Ensure drawing capture happens before turn completion
- Add intermediate "completing" status to prevent race conditions
- Both guesser and drawer must receive points atomically
- Validate turn status before processing (reject if not "drawing")

### 2. Fix drawing capture for all completion paths

**File**: `components/game/game-board.tsx`

**Changes**:

- Ensure drawing is captured and uploaded BEFORE calling turn completion mutations
- Handle three scenarios:
  - Guess submissions (input + button) - drawer captures before submitting
  - Time up - drawer captures automatically
  - Manual winner selection - drawer captures before selection
- Only the drawer client should capture/upload drawings
- Add proper error handling and retry logic for failed uploads
- Show loading state during upload
- Block turn completion until upload succeeds or explicitly fails

### 3. Implement draw-to-start timer

**Files**: `components/game/game-board.tsx`, `convex/schema.ts`, `convex/mutations/game.ts`

**Changes**:

- Change timer behavior to not set `started_at` on turn creation
- Start timer only on first drawing stroke
- Update schema to make `started_at` optional in `turns` table
- Add mutation to update `started_at` when first stroke is drawn
- Timer component should handle null `started_at` (show "Waiting for drawer...")

### 4. Create turn winner display component

**File**: `components/game/turn-winner-banner.tsx` (new)

**Changes**:

- Create new `TurnWinnerBanner` component
- Display winner name, points awarded, correct answer
- Position on right side of game board
- Show during turn completion
- Auto-hide on next turn start
- Subscribe to turn completion events
- Include celebration animation (confetti, etc.)

### 5. Add real-time guess feedback

**File**: `components/game/guess-feed.tsx` (new)

**Changes**:

- Create `GuessFeed` component displaying all player guesses in real-time
- Show correct/incorrect indicators
- Visible to all players during active turn
- Display in dedicated section (right sidebar or bottom panel)
- Include player avatars and timestamps
- Auto-scroll to latest guess

### 6. Ensure drawing canvas persistence

**File**: `components/game/drawing-canvas.tsx`

**Changes**:

- Never clear canvas before capture
- Add explicit `captureBeforeClear()` method that:
  1. Captures current canvas state
  2. Returns the captured data
  3. Only clears after successful capture
- Separate capture and clear operations
- Ensure `captureDrawing()` doesn't modify canvas state

## Further Considerations

### 1. Concurrency strategy

Should only the drawer capture/upload drawings, or should we add server-side validation that rejects duplicate turn completions?

**Recommended**: Drawer-only + server validation

- Only drawer client captures and uploads
- Server validates turn status (must be "drawing")
- Use intermediate "completing" status to prevent races
- Reject duplicate completion attempts

### 2. Drawing upload retry

If drawing upload fails, should we:

- A) Retry upload automatically
- B) Show error and let user retry manually
- C) Complete turn without drawing

**Recommended**: A with fallback to B

- Auto-retry up to 3 times with exponential backoff
- Show toast notification if all retries fail
- Allow manual retry with button
- Do NOT complete turn without drawing (drawer's work would be lost)

### 3. Timer synchronization

Should we add server-side timer validation to prevent client-side timer manipulation?

**Recommended**: Yes, validate time remaining server-side

- Store `started_at` timestamp in database
- Calculate elapsed time on server during turn completion
- Reject completions if time_limit exceeded
- Award points based on server-calculated time remaining
- Use client timer only for display purposes

### 4. Drawing record creation

Should we create a `drawings` table record for every turn, or only when drawing exists?

**Recommended**: Always create record

- Create drawing record at turn start with null `drawing_file_id`
- Update with storage ID after upload
- Ensures complete audit trail
- Allows tracking turns without drawings (time up with no strokes)

### 5. Guess feedback visibility

Should all players see all guesses, or only their own until turn ends?

**Recommended**: All players see all guesses

- Increases engagement and tension
- Players can see who's getting close
- Matches traditional Pictionary gameplay
- Filter out exact correct answers to prevent spoiling

## Implementation Priority

### Phase 1: Critical Fixes (Must Have)

1. Add drawer scoring to mutations
2. Fix drawing capture for all paths
3. Ensure atomic operations with proper validation
4. Add intermediate "completing" status

### Phase 2: Enhanced UX (Should Have)

1. Implement draw-to-start timer
2. Create turn winner display
3. Add guess feedback component
4. Drawing upload retry logic

### Phase 3: Polish (Nice to Have)

1. Server-side timer validation
2. Complete drawing records for all turns
3. Enhanced error handling and user feedback
4. Performance optimizations

## Success Criteria

- ✅ Drawer receives points for successful turns
- ✅ Drawing is captured and saved for all completion paths (guess, time up, manual)
- ✅ Canvas is never cleared before drawing is captured
- ✅ Timer starts only when drawing begins
- ✅ All players see real-time guess feedback
- ✅ Turn winner is displayed prominently at turn end
- ✅ No race conditions in turn completion
- ✅ Only drawer can trigger turn completion mutations
- ✅ Server validates all turn state transitions
- ✅ Failed uploads are retried automatically
