export interface Produit {
  id: string;
  lotId: string;
  userId: string;
  nom: string;
  marque: string | null;
  categorie: string;
  description: string | null;
  prixNeuf: number;
  coefRevient: number;
  prixRevient: number;
  qrCode: string;
  statut: string;
  photos: string[] | null;
  etatProduit: string | null;
  etatEmballage: string | null;
  prixEstimeVente?: number | null;
}
