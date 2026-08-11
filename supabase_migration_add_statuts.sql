-- Migration: Ajouter les nouveaux statuts à la contrainte de vérification des produits

-- Supprimer la contrainte existante
ALTER TABLE produits DROP CONSTRAINT IF EXISTS products_statut_check;

-- Ajouter une nouvelle contrainte avec les nouveaux statuts
ALTER TABLE produits ADD CONSTRAINT products_statut_check
  CHECK (statut IN ('brute', 'en_vente', 'vendu', 'archive', 'rebut', 'casse'));
