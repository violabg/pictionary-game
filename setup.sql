-- Users table (extends Supabase auth users)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  name text,
  full_name text,
  user_name text,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  primary key (id)
);

-- inserts a row into public.profiles
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    name,
    full_name,
    user_name,
    avatar_url
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'active', 'completed')),
  max_players INTEGER NOT NULL DEFAULT 8,
  current_drawer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  timer_end TIMESTAMP WITH TIME ZONE,
  timer INTEGER NOT NULL DEFAULT 120,
  card_title_length INTEGER NOT NULL DEFAULT 0,
  cards_generated BOOLEAN NOT NULL DEFAULT FALSE,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_length INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create guesses table
CREATE TABLE IF NOT EXISTS public.guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guess_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create drawings table
CREATE TABLE IF NOT EXISTS public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  drawer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  turn_id UUID REFERENCES turns(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create turns table to track each turn and its winner
CREATE TABLE IF NOT EXISTS public.turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  drawer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NULL,
  drawing_image_url TEXT, -- URL to the screenshot stored in Supabase Storage
  points_awarded INTEGER NOT NULL DEFAULT 0,
  drawer_points_awarded INTEGER DEFAULT 0,
  turn_number INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_turns_game_id ON public.turns(game_id);
CREATE INDEX IF NOT EXISTS idx_turns_completed_at ON public.turns(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_turns_winner_id ON public.turns(winner_id);

-- Create realtime publication for all tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  games, 
  players, 
  cards, 
  guesses, 
  drawings;

-- Enable Realtime for all tables
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.guesses;
alter publication supabase_realtime add table public.drawings;
alter publication supabase_realtime add table public.turns;

-- Set up row level security policies
alter table public.profiles enable row level security;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;


-- RLS policies for table: profiles
-- Explanation: Allow all users (authenticated and anonymous) to select profiles. Permissive policy for public profile data.
CREATE POLICY "Allow authenticated and anonymous users to select profiles"
ON profiles
FOR SELECT
TO authenticated, anon
USING (true);

-- Explanation: Allow only authenticated users to insert profile. (Supabase creates profile on signup)
CREATE POLICY "Allow authenticated users to insert profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

-- Explanation: Allow only authenticated users to update profile.
CREATE POLICY "Allow authenticated users to update profile"
ON profiles
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- Explanation: Allow only authenticated users to delete profile.
CREATE POLICY "Allow authenticated users to delete profile"
ON profiles
FOR DELETE
TO authenticated
USING ((select auth.uid()) = id);

-- RLS policies for table: games
-- Explanation: Allow all users to select games (public game data).
CREATE POLICY "Allow authenticated and anonymous users to select games"
ON games
FOR SELECT
TO authenticated, anon
USING (true);

-- Explanation: Allow only authenticated users to insert games (host a game).
CREATE POLICY "Allow authenticated users to insert games"
ON games
FOR INSERT
TO authenticated, anon  
WITH CHECK (true);

-- Explanation: Allow only the host to update games.
CREATE POLICY "Allow authenticated and anonymous to update the games"
ON games
FOR UPDATE
TO authenticated, anon
USING (true);

-- Explanation: Allow only the host to delete games.
CREATE POLICY "Allow host to delete games"
ON games
FOR DELETE
TO authenticated
USING (true);

-- RLS policies for table: players
-- Explanation: Allow all users to select players (public leaderboard/scoreboard).
CREATE POLICY "Allow authenticated and anonymous users to select players"
ON players
FOR SELECT
TO authenticated, anon
USING (true);

-- Explanation: Allow authenticated users to insert players.
CREATE POLICY "Allow authenticated users to insert players"
ON players
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Explanation: Allow authenticated users to update players row.
CREATE POLICY "Allow authenticated users to update players row"
ON players
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Explanation: Allow authenticated users to delete players row.
CREATE POLICY "Allow authenticated users to delete players row"
ON players
FOR DELETE
TO authenticated, anon
USING (true);

-- RLS policies for table: cards
-- Explanation: Allow all users to select cards (public game data).
CREATE POLICY "Allow authenticated and anonymous users to select cards"
ON cards
FOR SELECT
TO authenticated, anon
USING (true);

-- Explanation: Allow authenticated users to insert cards they authored.
CREATE POLICY "Allow authenticated users to insert cards"
ON cards
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Explanation: Allow only the author to update cards.
CREATE POLICY "Allow author to update cards"
ON cards
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Explanation: Allow only the author to delete cards.
CREATE POLICY "Allow author to delete cards"
ON cards
FOR DELETE
TO authenticated, anon
USING (true);

-- RLS policies for table: guesses
-- Explanation: Allow all users to select guesses (public game data).
CREATE POLICY "Allow authenticated and anonymous users to select guesses"
ON guesses
FOR SELECT
TO authenticated, anon
USING (true);

-- Explanation: Allow authenticated users to insert guesses.
CREATE POLICY "Allow authenticated users to insert guesses"
ON guesses
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Explanation: Allow authenticated users to update guesses.
CREATE POLICY "Allow authenticated users to update guesses"
ON guesses
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Explanation: Allow authenticated users to delete guesses.
CREATE POLICY "Allow authenticated users to delete guesses"
ON guesses
FOR DELETE
TO authenticated, anon
USING (true);

-- RLS policies for table: drawings
CREATE POLICY "Allow authenticated and anonymous users to select drawings"
ON drawings
FOR SELECT
TO authenticated, anon
USING (true);

-- Explanation: Allow authenticated and anonymous users to insert row.
CREATE POLICY "Allow authenticated and anonymous users to insert row"
ON drawings
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Explanation: Allow authenticated and anonymous users to update row.
CREATE POLICY "Allow authenticated and anonymous users to update row"
ON drawings
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Explanation: Allow authenticated and anonymous users to delete row.
CREATE POLICY "Allow authenticated and anonymous users to delete row"
ON drawings
FOR DELETE
TO authenticated, anon
USING (true);

-- RLS policies for table: turns
-- Enable RLS for turns table
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;

-- Allow all users to read turns (for history page)
CREATE POLICY "Allow authenticated and anonymous users to select turns"
ON turns
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow authenticated users to insert turns
CREATE POLICY "Allow authenticated and anonymous users to insert turns"
ON turns
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Allow authenticated users to update turns
CREATE POLICY "Allow authenticated users to update turns"
ON turns
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Explanation: Allow authenticated users to delete turns.
CREATE POLICY "Allow authenticated users to delete turns"
ON turns
FOR DELETE
TO authenticated, anon
USING (true);

-- Create storage bucket for game drawings
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-drawings', 'game-drawings', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for game-drawings bucket
CREATE POLICY "Allow public read access to game drawings"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-drawings');

CREATE POLICY "Allow authenticated users to upload game drawings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'game-drawings' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update game drawings"
ON storage.objects FOR UPDATE
USING (bucket_id = 'game-drawings' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete game drawings"
ON storage.objects FOR DELETE
USING (bucket_id = 'game-drawings' AND auth.uid() IS NOT NULL);

-- Create functions for game management
-- Create function to generate unique game codes
CREATE OR REPLACE FUNCTION public.generate_unique_game_code()
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public' 
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER := 0;
  pos INTEGER := 0;
BEGIN
   FOR i IN 1..6 LOOP
    pos := 1 + FLOOR(RANDOM() * LENGTH(chars));
    result := result || SUBSTRING(chars FROM pos FOR 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create trigger to automatically generate game codes
CREATE OR REPLACE FUNCTION set_game_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    LOOP
      NEW.code := generate_unique_game_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM games WHERE code = NEW.code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = 'public';

CREATE TRIGGER trigger_set_game_code
BEFORE INSERT ON games
FOR EACH ROW
EXECUTE FUNCTION set_game_code();


CREATE OR REPLACE FUNCTION get_user_profile_with_score(user_id uuid)
RETURNS TABLE(profile_id uuid, name text, full_name text, user_name text, avatar_url text, total_score bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.full_name, p.user_name, p.avatar_url, COALESCE(SUM(gp.score)::bigint, 0) AS total_score
    FROM profiles p
    LEFT JOIN players gp ON p.id = gp.player_id
    WHERE p.id = user_id
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = 'public';

-- Atomic turn completion functions
CREATE OR REPLACE FUNCTION complete_turn_time_up(
  p_game_id UUID,
  p_drawing_image_url TEXT DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN,
  next_drawer_id UUID,
  next_card_id UUID,
  turn_id UUID,
  game_completed BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_current_drawer_id UUID;
  v_current_card_id UUID;
  v_turn_number INTEGER;
  v_new_turn_id UUID;
  v_next_drawer_id UUID;
  v_next_card RECORD;
  v_game_completed BOOLEAN := FALSE;
BEGIN
  -- Lock the game row
  SELECT current_drawer_id, current_card_id
  INTO v_current_drawer_id, v_current_card_id
  FROM public.games
  WHERE id = p_game_id
  FOR UPDATE;

  -- Validate game state
  IF v_current_drawer_id IS NULL OR v_current_card_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Get next turn number
  SELECT COALESCE(MAX(turn_number), 0) + 1
  INTO v_turn_number
  FROM public.turns
  WHERE game_id = p_game_id;

  -- Create turn record with no winner, no points
  INSERT INTO public.turns (
    game_id,
    card_id,
    drawer_id,
    winner_id,
    points_awarded,
    drawer_points_awarded,
    turn_number,
    drawing_image_url
  ) VALUES (
    p_game_id,
    v_current_card_id,
    v_current_drawer_id,
    NULL,  -- No winner
    0,     -- No guesser points
    0,     -- No drawer points
    v_turn_number,
    p_drawing_image_url
  ) RETURNING id INTO v_new_turn_id;

  -- Mark current card as used
  UPDATE public.cards SET used = TRUE WHERE id = v_current_card_id;

  -- Determine next drawer (same logic as correct guess)
  WITH ordered_players AS (
    SELECT player_id, order_index,
           ROW_NUMBER() OVER (ORDER BY order_index) as rn
    FROM public.players
    WHERE game_id = p_game_id
    ORDER BY order_index
  ),
  current_drawer_rank AS (
    SELECT rn as current_rn
    FROM ordered_players
    WHERE player_id = v_current_drawer_id
  ),
  total_players AS (
    SELECT COUNT(*) as total
    FROM ordered_players
  )
  SELECT player_id INTO v_next_drawer_id
  FROM ordered_players, current_drawer_rank, total_players
  WHERE rn = (current_rn % total) + 1;

  -- Get next unused card
  SELECT id, title INTO v_next_card
  FROM public.cards
  WHERE game_id = p_game_id AND used = FALSE
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_next_card.id IS NULL THEN
    -- No more cards, complete the game
    UPDATE public.games
    SET status = 'completed',
        current_drawer_id = NULL,
        current_card_id = NULL,
        timer_end = NULL
    WHERE id = p_game_id;
    
    v_game_completed := TRUE;
  ELSE
    -- Set up next turn
    UPDATE public.games
    SET current_drawer_id = v_next_drawer_id,
        current_card_id = v_next_card.id,
        timer_end = NULL
    WHERE id = p_game_id;
  END IF;

  -- Return results
  RETURN QUERY SELECT
    TRUE as success,
    v_next_drawer_id as next_drawer_id,
    v_next_card.id as next_card_id,
    v_new_turn_id as turn_id,
    v_game_completed as game_completed;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in complete_turn_time_up: %', SQLERRM;
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::UUID, FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION complete_turn_manual_winner(
  p_game_id UUID,
  p_winner_id UUID,
  p_time_remaining INTEGER,
  p_drawing_image_url TEXT DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN,
  next_drawer_id UUID,
  next_card_id UUID,
  winner_new_score INTEGER,
  drawer_new_score INTEGER,
  turn_id UUID,
  game_completed BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  v_current_drawer_id UUID;
  v_current_card_id UUID;
  v_winner_current_score INTEGER;
  v_drawer_current_score INTEGER;
  v_winner_points INTEGER;
  v_drawer_points INTEGER;
  v_turn_number INTEGER;
  v_new_turn_id UUID;
  v_next_drawer_id UUID;
  v_next_card RECORD;
  v_game_completed BOOLEAN := FALSE;
BEGIN
  -- Lock the game row
  SELECT current_drawer_id, current_card_id
  INTO v_current_drawer_id, v_current_card_id
  FROM public.games
  WHERE id = p_game_id
  FOR UPDATE;

  -- Validate game state
  IF v_current_drawer_id IS NULL OR v_current_card_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, 0, 0, NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Validate winner is a player in the game (and not the drawer)
  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE game_id = p_game_id
    AND player_id = p_winner_id
    AND player_id != v_current_drawer_id
  ) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, 0, 0, NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Calculate points
  v_winner_points := p_time_remaining;
  v_drawer_points := GREATEST(10, p_time_remaining / 4);

  -- Get current scores
  SELECT score INTO v_winner_current_score
  FROM public.players
  WHERE game_id = p_game_id AND player_id = p_winner_id;

  SELECT score INTO v_drawer_current_score
  FROM public.players
  WHERE game_id = p_game_id AND player_id = v_current_drawer_id;

  -- Update scores
  UPDATE public.players
  SET score = score + v_winner_points
  WHERE game_id = p_game_id AND player_id = p_winner_id;

  UPDATE public.players
  SET score = score + v_drawer_points
  WHERE game_id = p_game_id AND player_id = v_current_drawer_id;

  -- Get next turn number
  SELECT COALESCE(MAX(turn_number), 0) + 1
  INTO v_turn_number
  FROM public.turns
  WHERE game_id = p_game_id;

  -- Create turn record
  INSERT INTO public.turns (
    game_id,
    card_id,
    drawer_id,
    winner_id,
    points_awarded,
    drawer_points_awarded,
    turn_number,
    drawing_image_url
  ) VALUES (
    p_game_id,
    v_current_card_id,
    v_current_drawer_id,
    p_winner_id,
    v_winner_points,
    v_drawer_points,
    v_turn_number,
    p_drawing_image_url
  ) RETURNING id INTO v_new_turn_id;

  -- Mark current card as used
  UPDATE public.cards SET used = TRUE WHERE id = v_current_card_id;

  -- Determine next drawer (same logic as other functions)
  WITH ordered_players AS (
    SELECT player_id, order_index,
           ROW_NUMBER() OVER (ORDER BY order_index) as rn
    FROM public.players
    WHERE game_id = p_game_id
    ORDER BY order_index
  ),
  current_drawer_rank AS (
    SELECT rn as current_rn
    FROM ordered_players
    WHERE player_id = v_current_drawer_id
  ),
  total_players AS (
    SELECT COUNT(*) as total
    FROM ordered_players
  )
  SELECT player_id INTO v_next_drawer_id
  FROM ordered_players, current_drawer_rank, total_players
  WHERE rn = (current_rn % total) + 1;

  -- Get next unused card
  SELECT id, title INTO v_next_card
  FROM public.cards
  WHERE game_id = p_game_id AND used = FALSE
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_next_card.id IS NULL THEN
    -- No more cards, complete the game
    UPDATE public.games
    SET status = 'completed',
        current_drawer_id = NULL,
        current_card_id = NULL,
        timer_end = NULL
    WHERE id = p_game_id;
    
    v_game_completed := TRUE;
  ELSE
    -- Set up next turn
    UPDATE public.games
    SET current_drawer_id = v_next_drawer_id,
        current_card_id = v_next_card.id,
        timer_end = NULL
    WHERE id = p_game_id;
  END IF;

  -- Return results
  RETURN QUERY SELECT
    TRUE as success,
    v_next_drawer_id as next_drawer_id,
    v_next_card.id as next_card_id,
    (v_winner_current_score + v_winner_points) as winner_new_score,
    (v_drawer_current_score + v_drawer_points) as drawer_new_score,
    v_new_turn_id as turn_id,
    v_game_completed as game_completed;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in complete_turn_manual_winner: %', SQLERRM;
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, 0, 0, NULL::UUID, FALSE;
END;
$$;

-- Atomic function that combines guess submission and turn completion to prevent race conditions
CREATE OR REPLACE FUNCTION submit_guess_and_complete_turn_if_correct(
    p_game_id UUID,
    p_guesser_profile_id UUID,
    p_guess_text TEXT,
    p_time_remaining INTEGER,
    p_drawing_image_url TEXT DEFAULT NULL,
    p_is_correct BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    guess_id UUID,
    is_correct BOOLEAN,
    success BOOLEAN,
    next_drawer_id UUID,
    next_card_id UUID,
    guesser_new_score INTEGER,
    drawer_new_score INTEGER,
    turn_id UUID,
    game_completed BOOLEAN
) AS $$
DECLARE
    v_current_card_id UUID;
    v_current_drawer_id UUID;
    v_card_title TEXT;
    v_is_correct BOOLEAN;
    v_guess_id UUID;
    v_drawer_points INTEGER;
    v_turn_id UUID;
    v_next_drawer_id UUID;
    v_next_card_id UUID;
    v_game_completed BOOLEAN := FALSE;
BEGIN
    -- Get current game state
    SELECT current_card_id, current_drawer_id
    INTO v_current_card_id, v_current_drawer_id
    FROM games
    WHERE id = p_game_id;

    -- Get current card title
    SELECT title
    INTO v_card_title
    FROM cards
    WHERE id = v_current_card_id;

    -- Determine if guess is correct using provided p_is_correct or fallback to exact match
    v_is_correct := COALESCE(p_is_correct, LOWER(TRIM(p_guess_text)) = LOWER(TRIM(v_card_title)));

    -- Insert guess and get its ID
    INSERT INTO guesses (id, game_id, player_id, guess_text, is_correct)
    VALUES (gen_random_uuid(), p_game_id, p_guesser_profile_id, p_guess_text, v_is_correct)
    RETURNING id INTO v_guess_id;

    -- If guess is correct, complete the turn
    IF v_is_correct THEN
        -- Calculate points for guesser and drawer
        UPDATE players
        SET score = score + p_time_remaining
        WHERE game_id = p_game_id AND player_id = p_guesser_profile_id
        RETURNING score INTO guesser_new_score;

        v_drawer_points := GREATEST(10, p_time_remaining / 4);
        
        UPDATE players
        SET score = score + v_drawer_points
        WHERE game_id = p_game_id AND player_id = v_current_drawer_id
        RETURNING score INTO drawer_new_score;

        -- Create turn record
        INSERT INTO turns (
            id,
            game_id,
            card_id,
            drawer_id,
            winner_id,
            points_awarded,
            drawer_points_awarded,
            turn_number,
            completed_at,
            drawing_image_url
        )
        SELECT
            gen_random_uuid(),
            p_game_id,
            v_current_card_id,
            v_current_drawer_id,
            p_guesser_profile_id,
            p_time_remaining,
            v_drawer_points,
            COALESCE(MAX(turn_number), 0) + 1,
            NOW(),
            p_drawing_image_url
        FROM turns
        WHERE game_id = p_game_id
        RETURNING id INTO v_turn_id;

        -- Mark current card as used
        UPDATE cards
        SET used = TRUE
        WHERE id = v_current_card_id;

        -- Get next card and drawer
        WITH next_card AS (
            SELECT id
            FROM cards
            WHERE game_id = p_game_id AND NOT used
            ORDER BY RANDOM()
            LIMIT 1
        ),
        next_drawer AS (
            SELECT player_id
            FROM players
            WHERE game_id = p_game_id
            ORDER BY 
                CASE WHEN order_index > (
                    SELECT order_index 
                    FROM players 
                    WHERE game_id = p_game_id AND player_id = v_current_drawer_id
                ) THEN order_index END ASC NULLS LAST,
                order_index ASC
            LIMIT 1
        )
        SELECT
            next_drawer.player_id,
            next_card.id,
            next_card.id IS NULL
        INTO
            v_next_drawer_id,
            v_next_card_id,
            v_game_completed
        FROM next_drawer
        CROSS JOIN next_card;

        -- Update game state
        UPDATE games
        SET
            current_drawer_id = v_next_drawer_id,
            current_card_id = v_next_card_id,
            status = CASE 
                WHEN v_game_completed THEN 'completed'
                ELSE status
            END,
            timer_end = NULL
        WHERE id = p_game_id;

        RETURN QUERY
        SELECT
            v_guess_id,
            v_is_correct,
            TRUE,
            v_next_drawer_id,
            v_next_card_id,
            guesser_new_score,
            drawer_new_score,
            v_turn_id,
            v_game_completed;
    ELSE
        -- If guess was incorrect, just return the guess info
        RETURN QUERY
        SELECT
            v_guess_id,
            v_is_correct,
            FALSE,
            NULL::UUID,
            NULL::UUID,
            NULL::INTEGER,
            NULL::INTEGER,
            NULL::UUID,
            FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' ;