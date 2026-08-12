-- Migration: Ajouter les nouveaux statuts et états d'emballage

-- Supprimer les anciennes contraintes
ALTER TABLE produits DROP CONSTRAINT IF EXISTS products_statut_check;
ALTER TABLE produits DROP CONSTRAINT IF EXISTS products_etat_emballage_check;

-- Ajouter les contraintes avec les valeurs correctes
ALTER TABLE produits ADD CONSTRAINT products_statut_check
  CHECK (statut IN ('brute', 'en_vente', 'vendu', 'archive', 'rebut', 'casse'));

ALTER TABLE produits ADD CONSTRAINT products_etat_emballage_check
  CHECK (etat_emballage IN ('emballage_neuf', 'emballage_coupe', 'pas_d_emballage', 'emballage_abime'));
