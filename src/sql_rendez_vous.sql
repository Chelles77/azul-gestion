-- Table pour les rendez-vous
CREATE TABLE IF NOT EXISTS rendez_vous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  avec_qui TEXT NOT NULL,
  date_heure TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_rendez_vous_user_id ON rendez_vous(user_id);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_date_heure ON rendez_vous(date_heure);

-- RLS pour les rendez-vous
ALTER TABLE rendez_vous ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rendez_vous" ON rendez_vous;
CREATE POLICY "Users can view their own rendez_vous"
  ON rendez_vous FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own rendez_vous" ON rendez_vous;
CREATE POLICY "Users can insert their own rendez_vous"
  ON rendez_vous FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rendez_vous" ON rendez_vous;
CREATE POLICY "Users can update their own rendez_vous"
  ON rendez_vous FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own rendez_vous" ON rendez_vous;
CREATE POLICY "Users can delete their own rendez_vous"
  ON rendez_vous FOR DELETE
  USING (auth.uid() = user_id);
