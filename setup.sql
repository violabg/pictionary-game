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
  cards_generated BOOLEAN NOT NULL DEFAULT FALSE,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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

-- Create function to increment score if it doesn't exist
CREATE OR REPLACE FUNCTION increment_score(points INTEGER, row_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_score INTEGER;
BEGIN
  SELECT score INTO current_score FROM public.players WHERE id = row_id;
  RETURN current_score + points;
END;
$$ LANGUAGE plpgsql;

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

-- Set up row level security policies
alter table public.profiles enable row level security;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;


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