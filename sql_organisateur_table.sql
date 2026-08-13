-- Table pour stocker les activités de la journée
CREATE TABLE IF NOT EXISTS activites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'Travail', -- 'Travail' ou 'Perso'
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  couleur TEXT DEFAULT '#3b82f6',
  description TEXT,
  priorite INTEGER DEFAULT 1, -- 1-5
  statut TEXT DEFAULT 'planifiee', -- 'planifiee', 'en_cours', 'terminee'
  date_jour DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activites_user_id ON activites(user_id);
CREATE INDEX IF NOT EXISTS idx_activites_date_jour ON activites(date_jour);
CREATE INDEX IF NOT EXISTS idx_activites_user_date ON activites(user_id, date_jour);

-- RLS
ALTER TABLE activites ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own activites" ON activites;
CREATE POLICY "Users can view their own activites"
  ON activites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activites" ON activites;
CREATE POLICY "Users can insert their own activites"
  ON activites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own activites" ON activites;
CREATE POLICY "Users can update their own activites"
  ON activites FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own activites" ON activites;
CREATE POLICY "Users can delete their own activites"
  ON activites FOR DELETE
  USING (auth.uid() = user_id);
