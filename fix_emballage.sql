-- Corriger tous les etat_emballage invalides
UPDATE produits SET etat_emballage = 'Coupé' WHERE etat_emballage = 'Emballage coupé';
UPDATE produits SET etat_emballage = 'Neuf' WHERE etat_emballage ILIKE '%neuf%';
UPDATE produits SET etat_emballage = 'Abîmé' WHERE etat_emballage ILIKE '%abîm%';
UPDATE produits SET etat_emballage = 'Bon' WHERE etat_emballage = 'Bon état' OR (etat_emballage IS NOT NULL AND etat_emballage NOT IN ('Bon', 'Neuf', 'Coupé', 'Abîmé', 'Pas d''emballage'));
