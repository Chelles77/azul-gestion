-- Créer la table depenses
CREATE TABLE IF NOT EXISTS depenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'Autres',
  fournisseur TEXT,
  description TEXT,
  photo TEXT,
  date_depense TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer les indexes
CREATE INDEX IF NOT EXISTS idx_depenses_user_id ON depenses(user_id);
CREATE INDEX IF NOT EXISTS idx_depenses_date_depense ON depenses(date_depense);
CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON depenses(categorie);

-- Activer RLS
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;

-- Créer les policies
DROP POLICY IF EXISTS "Users can view their own depenses" ON depenses;
CREATE POLICY "Users can view their own depenses"
  ON depenses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own depenses" ON depenses;
CREATE POLICY "Users can insert their own depenses"
  ON depenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own depenses" ON depenses;
CREATE POLICY "Users can update their own depenses"
  ON depenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own depenses" ON depenses;
CREATE POLICY "Users can delete their own depenses"
  ON depenses FOR DELETE
  USING (auth.uid() = user_id);
