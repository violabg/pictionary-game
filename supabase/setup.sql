-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  current_drawer_id UUID,
  current_card_id UUID,
  timer_end TIMESTAMP WITH TIME ZONE,
  cards_generated BOOLEAN NOT NULL DEFAULT FALSE,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create guesses table
CREATE TABLE IF NOT EXISTS public.guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL,
  player_id UUID NOT NULL,
  guess_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create drawings table
CREATE TABLE IF NOT EXISTS public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL,
  card_id UUID NOT NULL,
  drawer_id UUID NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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

-- Set up row level security policies
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for simplicity in this demo)
CREATE POLICY "Allow public read access on games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on games" ON public.games FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on players" ON public.players FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on cards" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on cards" ON public.cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on cards" ON public.cards FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on guesses" ON public.guesses FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on guesses" ON public.guesses FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on drawings" ON public.drawings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on drawings" ON public.drawings FOR INSERT WITH CHECK (true);
