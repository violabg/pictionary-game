-- Add timer column to games table
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS timer INTEGER NOT NULL DEFAULT 120;
