# Pictionary Game - Testing Guide

## Pre-Test Setup

1. **Start Convex Dev Server**

   ```bash
   npx convex dev
   ```

2. **Start Next.js Dev Server** (in another terminal)

   ```bash
   npm run dev
   ```

3. **Access Application**
   - Open http://localhost:3000 in your browser

## Test Scenarios

### 1. Authentication Flow ✅

#### 1.1 Sign Up

- [ ] Navigate to `/auth/sign-up`
- [ ] Enter valid email and password
- [ ] Click "Sign Up"
- [ ] Verify redirect to success page
- [ ] Verify user is authenticated in navbar

#### 1.2 Login

- [ ] Navigate to `/auth/login`
- [ ] Enter existing user credentials
- [ ] Click "Login"
- [ ] Verify redirect to home page
- [ ] Verify user name shows in navbar

#### 1.3 Logout

- [ ] Click on user avatar in navbar
- [ ] Click "Logout"
- [ ] Verify redirect to login page
- [ ] Verify navbar shows login/signup buttons

#### 1.4 Forgot Password

- [ ] Navigate to `/auth/forgot-password`
- [ ] Enter registered email
- [ ] Click "Send Reset Link"
- [ ] Check email for reset link
- [ ] Click link and reset password

#### 1.5 Update Password

- [ ] After login, click avatar → Account settings
- [ ] Navigate to `/auth/update-password`
- [ ] Enter current and new password
- [ ] Click "Update"
- [ ] Verify password changed

### 2. Game Creation ✅

#### 2.1 Create New Game

- [ ] Navigate to `/gioca` (Create Game page)
- [ ] Select a category from dropdown
- [ ] Enter number of rounds (1-10)
- [ ] Click "Crea partita" (Create Game)
- [ ] Verify redirect to game page
- [ ] Verify game code displayed
- [ ] Verify user is host

#### 2.2 Game Setup Validation

- [ ] Try submitting without category → error message
- [ ] Try rounds > 10 → error message
- [ ] Try rounds < 1 → error message
- [ ] Try duplicate category selection → still works

### 3. Game Lobby ✅

#### 3.1 Game Lobby Display

- [ ] Verify game code visible
- [ ] Verify player list showing current player
- [ ] Verify "Ready" button available
- [ ] Verify "Start Game" button only for host
- [ ] Verify category and round count displayed

#### 3.2 Player Management

- [ ] Host can see "Start Game" button
- [ ] Non-host sees only "Ready" button
- [ ] Multiple players can join same game
- [ ] Player list updates in real-time
- [ ] Each player shows score (starting at 0)

### 4. Game Joining ✅

#### 4.1 Join Existing Game

- [ ] Have Host create game and get code
- [ ] Log in as different user
- [ ] Navigate to `/gioca`
- [ ] Enter game code
- [ ] Click "Join"
- [ ] Verify redirect to game page
- [ ] Verify in player list

#### 4.2 Error Handling

- [ ] Try invalid game code → error
- [ ] Try joining full game (if limit) → error
- [ ] Try joining finished game → error

### 5. Gameplay - Drawing Phase ✅

#### 5.1 Drawing Canvas

- [ ] Brush tool draws on canvas
- [ ] Eraser tool removes drawings
- [ ] Color picker changes brush color
- [ ] Brush size slider works (1-20px)
- [ ] Undo (Ctrl+Z) removes last stroke
- [ ] Clear Canvas button empties canvas
- [ ] Canvas persists during turn

#### 5.2 Drawing Tools

- [ ] Toolbar responsive to clicks
- [ ] Cursor changes for eraser mode
- [ ] Drawing appears immediately
- [ ] No lag in drawing

#### 5.3 Drawing Export

- [ ] Drawing screenshot captures on turn end
- [ ] Screenshot uploads to Convex storage
- [ ] Uploaded drawing accessible in history

### 6. Gameplay - Guessing Phase ✅

#### 6.1 Guess Input

- [ ] Non-drawers see guess input field
- [ ] Can type guess
- [ ] Can submit guess with Enter key
- [ ] Can submit guess with button
- [ ] Guess counter updates after submit

#### 6.2 Guess Validation

- [ ] AI validates guesses
- [ ] Similar guesses accepted
- [ ] Exact guesses accepted
- [ ] Incorrect guesses rejected
- [ ] Explanation shown in logs

#### 6.3 Score Update

- [ ] Correct guess adds points to guesser
- [ ] Drawer gets points for correct guess
- [ ] Scores update immediately
- [ ] Final scores shown at end

### 7. Game Timer ✅

#### 7.1 Timer Display

- [ ] Timer shows in top right
- [ ] Timer counts down from 60
- [ ] Timer changes color when low (< 10s)
- [ ] Timer stops at 0

#### 7.2 Timer Behavior

- [ ] Drawing phase: 60 second timer
- [ ] Timer enforces phase transition
- [ ] Pause button works (if implemented)

### 8. Game Completion ✅

#### 8.1 Game Over Screen

- [ ] After all rounds, game ends
- [ ] Winner determined by highest score
- [ ] All players' final scores displayed
- [ ] Confetti animation plays
- [ ] "Back to Home" button available

#### 8.2 Game History

- [ ] Game saved to history
- [ ] Accessible from `/history`
- [ ] Shows game date, category, rounds
- [ ] Shows final scores and winner

### 9. Game History ✅

#### 9.1 History Display

- [ ] List of completed games
- [ ] Filter by category
- [ ] Pagination works
- [ ] Each game shows summary

#### 9.2 Game Details

- [ ] Click game to expand
- [ ] See all rounds' data
- [ ] See drawings (if stored)
- [ ] See guesses and scores

### 10. User Profile ✅

#### 10.1 Profile Page

- [ ] Navigate to `/profile`
- [ ] User info displayed
- [ ] Avatar shown (if set)
- [ ] Username and email visible

#### 10.2 Statistics

- [ ] Games played count
- [ ] Win count
- [ ] Average score
- [ ] Recent games listed

## Performance Checks

- [ ] App loads in < 3 seconds
- [ ] Drawing is smooth (60fps)
- [ ] No console errors
- [ ] No memory leaks (open DevTools)
- [ ] Responsive on mobile

## Database Checks

- [ ] Users table has entries
- [ ] Games table tracks game state
- [ ] Turns table records drawing/guessing phases
- [ ] Players table tracks game participants
- [ ] Profiles table stores user info
- [ ] Guesses table logs submissions
- [ ] Cards table supplies drawing cards

## TypeScript & Build Checks

```bash
# Type checking
npx tsc --noEmit

# Build
npm run build

# Linting
npm run lint
```

Expected: 0 errors for all checks

## Browser Console Checks

- [ ] No red errors
- [ ] No 404 for resources
- [ ] No CORS errors
- [ ] No React warnings (dev mode)

## Known Limitations (Phase 2)

- Real-time drawing broadcasting not implemented
  - Players see their own drawing, but not others' in real-time
  - Final drawing uploaded after timer ends
- No live chat during gameplay

- No spectator mode

## Testing Complete Checklist

- [ ] All authentication tests passed
- [ ] All game creation tests passed
- [ ] All game lobby tests passed
- [ ] All drawing tests passed
- [ ] All guessing tests passed
- [ ] All timer tests passed
- [ ] All game completion tests passed
- [ ] All history tests passed
- [ ] All profile tests passed
- [ ] All performance checks passed
- [ ] All database checks passed
- [ ] All browser console clean

## Bug Report Template

If issues found, please report:

1. **Description**: Clear description of issue
2. **Steps to Reproduce**: Numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happened
5. **Screenshots**: If applicable
6. **Console Errors**: Any error messages
7. **Environment**: Browser, OS, screen size

---

**Last Updated**: December 16, 2025
**Migration Status**: ✅ Complete
**Ready for Testing**: Yes
