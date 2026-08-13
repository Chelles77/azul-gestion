-- Table pour stocker les identifiants
CREATE TABLE IF NOT EXISTS identifiants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_site TEXT NOT NULL,
  email TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  categorie TEXT DEFAULT 'Autre',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour stocker les notes (pense-bête)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_identifiants_user_id ON identifiants(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

-- RLS pour identifiants
ALTER TABLE identifiants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own identifiants" ON identifiants;
CREATE POLICY "Users can view their own identifiants"
  ON identifiants FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own identifiants" ON identifiants;
CREATE POLICY "Users can insert their own identifiants"
  ON identifiants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own identifiants" ON identifiants;
CREATE POLICY "Users can update their own identifiants"
  ON identifiants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own identifiants" ON identifiants;
CREATE POLICY "Users can delete their own identifiants"
  ON identifiants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS pour notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;
CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);
