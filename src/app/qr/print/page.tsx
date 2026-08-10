'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Produit } from '@/lib/interfaces';
import QRCode from 'qrcode';
import { Download, Filter } from 'lucide-react';

export default function QRPrintPage() {
  const [products, setProducts] = useState<Produit[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState('');
  const [lots, setLots] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('brute');

  useEffect(() => {
    loadLots();
  }, []);

  useEffect(() => {
    if (selectedLot || filterStatus) {
      loadProducts();
    }
  }, [selectedLot, filterStatus]);

  const loadLots = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('lots').select('id, numerolot').order('dateachat', { ascending: false });
    setLots(data || []);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase.from('produits').select('*');

      if (selectedLot) {
        query = query.eq('lot_id', selectedLot);
      }

      if (filterStatus) {
        query = query.eq('statut', filterStatus);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setProducts(data || []);

      // Générer tous les QR codes
      const qrMap: Record<string, string> = {};
      for (const product of data || []) {
        try {
          const url = await QRCode.toDataURL(product.qr_code, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          qrMap[product.id] = url;
        } catch (err) {
          console.error('QR Error:', err);
        }
      }
      setQrCodes(qrMap);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Controls */}
      <div className="max-w-7xl mx-auto mb-8 print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
          {/* Lot Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lot (optionnel)</label>
            <select
              value={selectedLot}
              onChange={(e) => setSelectedLot(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tous les lots</option>
              {lots.map(lot => (
                <option key={lot.id} value={lot.id}>{lot.numerolot}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="brute">Brute (non validé)</option>
              <option value="en_vente">En Vente</option>
              <option value="vendu">Vendu</option>
              <option value="">Tous</option>
            </select>
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
          >
            <Download size={18} /> Imprimer (Ctrl+P)
          </button>

          {/* Count */}
          <div className="text-gray-600 text-sm font-medium">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 print:hidden">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Génération des QR codes...</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="max-w-7xl mx-auto">
          {/* Grid: 5 colonnes x 4 lignes = 20 QR codes par page A4 */}
          <div className="grid grid-cols-5 gap-4 print:gap-2 print:p-4" style={{ pageBreakInside: 'avoid' }}>
            {products.map(product => (
              <div
                key={product.id}
                className="flex flex-col items-center justify-center print:text-xs"
                style={{ pageBreakInside: 'avoid' }}
              >
                {/* QR Code */}
                {qrCodes[product.id] ? (
                  <div className="mb-1 print:mb-0.5 bg-white p-1 print:p-0.5 border border-gray-200 print:border-0">
                    <img
                      src={qrCodes[product.id]}
                      alt={`QR ${product.qr_code}`}
                      className="w-32 h-32 print:w-24 print:h-24"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 print:w-24 print:h-24 bg-gray-100 flex items-center justify-center mb-1 print:mb-0.5">
                    Chargement...
                  </div>
                )}

                {/* Produit Name */}
                <p className="text-center text-xs print:text-[0.6rem] font-medium text-gray-800 line-clamp-2 w-32 print:w-24">
                  {product.nom}
                </p>

                {/* QR Code Text */}
                <p className="text-center text-[0.65rem] print:text-[0.5rem] text-gray-500 mt-0.5 print:mt-0">
                  {product.qr_code}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-12 text-gray-500 print:hidden">
          <Filter size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun produit à imprimer</p>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 5mm;
          }
        }
      `}</style>
    </div>
  );
}
