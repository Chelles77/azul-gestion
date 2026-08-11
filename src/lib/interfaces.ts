// Types pour Produit
export interface Produit {
  id: string;
  lot_id: string;
  user_id: string;
  nom: string;
  marque: string | null;
  categorie: string;
  description: string | null;
  prix_neuf: number;
  coef_revient: number;
  prix_revient: number;
  qr_code: string;
  statut: 'brute' | 'en_vente' | 'vendu' | 'archive';
  photos: string[] | null;
  etat_produit: string | null;
  etat_emballage: string | null;
  prix_estime_vente: number | null;
  product_number?: string;
  plateformes_vente?: string[];
  created_at: string;
  updated_at: string;
}

// Type Lot (existant pour référence)
export interface Lot {
  id: string;
  user_id: string;
  numerolot: string;
  dateachat: string;
  source: string;
  prixAchat: number;
  fraisport: number;
  fraisencheres: number;
  couttotal: number;
  nbpalettes: number;
  nbpieces: number;
  prixneuftotal: number;
  tauxrebut: number;
  indiceachat: number;
  coutreelparpiece: number;
  created_at: string;
}
