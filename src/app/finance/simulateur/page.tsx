'use client';

import { useState } from 'react';
import { Upload, DownloadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Product {
  id: number;
  name: string;
  priceNeuf: number;
}

interface SimulationResult {
  id: number;
  name: string;
  priceNeuf: number;
  costPerProduct: number;
  coefficient: number;
  score: number;
  color: 'red' | 'orange' | 'yellow' | 'green';
  colorLabel: string;
}

export default function SimulateurPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulaire
  const [totalPrice, setTotalPrice] = useState('');
  const [palettes, setPalettes] = useState('4');
  const [shippingCost, setShippingCost] = useState('');
  const [feesPercent, setFeesPercent] = useState('5');

  // Résultats
  const [costPerPalette, setCostPerPalette] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [savedSimulation, setSavedSimulation] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

        const parsedProducts: Product[] = [];

        // Skip header row (row 0 is usually headers in Excel)
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (row && row.length >= 3) {
            const id = row[0];
            const name = row[1]?.toString().trim();
            const priceNeuf = parseFloat(row[2]);

            if (name && !isNaN(priceNeuf) && priceNeuf > 0) {
              parsedProducts.push({
                id: i,
                name: name.substring(0, 100), // Limiter la longueur
                priceNeuf: priceNeuf
              });
            }
          }
        }

        setProducts(parsedProducts);
        setResults([]);
        setShowResults(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Erreur parsing:', error);
      alert('Erreur lors de la lecture du fichier');
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (coefficient: number, priceNeuf: number): { score: number; color: 'red' | 'orange' | 'yellow' | 'green' } => {
    // Score basé sur coefficient et plage de prix
    let baseScore = 20;

    // Pénalité si coefficient trop haut (coûte cher)
    if (coefficient > 1) baseScore -= 10; // Si on paie plus que le prix neuf
    else if (coefficient > 0.8) baseScore -= 5;
    else if (coefficient > 0.6) baseScore -= 2;

    // Bonus selon la plage de prix (produits plus chers = plus faciles à vendre)
    if (priceNeuf >= 2000) baseScore += 3;
    else if (priceNeuf >= 1000) baseScore += 2;
    else if (priceNeuf >= 500) baseScore += 1;
    else if (priceNeuf < 100) baseScore -= 3;

    const finalScore = Math.max(0, Math.min(20, Math.round(baseScore * 10) / 10));

    let color: 'red' | 'orange' | 'yellow' | 'green';
    if (finalScore < 7) color = 'red';
    else if (finalScore < 13) color = 'orange';
    else if (finalScore < 17) color = 'yellow';
    else color = 'green';

    return { score: finalScore, color };
  };

  const handleReset = () => {
    setProducts([]);
    setResults([]);
    setTotalPrice('');
    setPalettes('4');
    setShippingCost('');
    setFeesPercent('5');
    setCostPerPalette(0);
    setShowResults(false);
    setSavedSimulation(null);
  };

  const handleSaveSimulation = () => {
    const simulation = {
      timestamp: new Date().toLocaleString('fr-FR'),
      products,
      totalPrice,
      palettes,
      shippingCost,
      feesPercent,
      results,
      costPerPalette
    };
    setSavedSimulation(simulation);
    localStorage.setItem('lastSimulation', JSON.stringify(simulation));
    alert('✅ Simulation sauvegardée !');
  };

  const handleCalculate = () => {
    if (!totalPrice || !shippingCost || !palettes) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const total = parseFloat(totalPrice);
    const shipping = parseFloat(shippingCost);
    const fees = parseFloat(feesPercent);
    const paletteCount = parseInt(palettes);

    if (isNaN(total) || isNaN(shipping) || isNaN(fees) || isNaN(paletteCount) || total <= 0 || shipping < 0 || fees < 0) {
      alert('Valeurs invalides');
      return;
    }

    // Coût par palette
    const costPerPalette = (total + shipping) / paletteCount;
    setCostPerPalette(costPerPalette);

    // Coût par produit (avant frais)
    const costPerProductBeforeFees = (total + shipping) / products.length;

    // Coût avec frais d'enchère
    const feeAmount = total * (fees / 100);
    const totalCost = total + shipping + feeAmount;
    const costPerProductAfterFees = totalCost / products.length;

    // Calculer les résultats
    const newResults: SimulationResult[] = products.map((product) => {
      const coefficient = costPerProductAfterFees / product.priceNeuf;
      const { score, color } = calculateScore(coefficient, product.priceNeuf);

      const colorLabels = {
        red: '🔴 Ne pas acheter',
        orange: '🟠 Ne pas acheter',
        yellow: '🟡 Risque modéré',
        green: '🟢 Vous pouvez acheter'
      };

      return {
        id: product.id,
        name: product.name,
        priceNeuf: product.priceNeuf,
        costPerProduct: costPerProductAfterFees,
        coefficient: coefficient,
        score: score,
        color: color,
        colorLabel: colorLabels[color]
      };
    });

    setResults(newResults);
    setShowResults(true);
  };

  const averageScore = results.length > 0
    ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Simulateur d'Achat</h1>
          <p className="text-gray-400">Analysez les lots avant d'acheter - Note /20 et recommandation</p>
        </div>

        {/* UPLOAD & FORM SECTION */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 mb-8">

          {/* File Upload */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              📁 Télécharger le fichier Excel
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload size={32} className="text-gray-400" />
                <span className="text-sm text-gray-400">Cliquez pour uploader ou glissez votre fichier</span>
                <span className="text-xs text-gray-500">Format: Excel (.xlsx, .xls, .csv)</span>
              </label>
            </div>
            {products.length > 0 && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded text-green-400 text-sm">
                ✅ {products.length} produits chargés
              </div>
            )}
          </div>

          {/* Formulaire Paramètres */}
          {products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

              {/* Prix Total */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Prix Total du Lot (€)</label>
                <input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white"
                />
              </div>

              {/* Nombre de Palettes */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Nombre de Palettes</label>
                <select
                  value={palettes}
                  onChange={(e) => setPalettes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white"
                >
                  <option value="4">4 palettes</option>
                  <option value="16">16 palettes</option>
                  <option value="32">32 palettes</option>
                </select>
              </div>

              {/* Frais de Port */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Frais de Port (€)</label>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white"
                />
              </div>

              {/* Frais d'Enchère % */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Frais d'Enchère (%)</label>
                <select
                  value={feesPercent}
                  onChange={(e) => setFeesPercent(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white"
                >
                  <option value="4.8">4.8%</option>
                  <option value="4.9">4.9%</option>
                  <option value="5">5%</option>
                </select>
              </div>
            </div>
          )}

          {/* Boutons Calculer / Vider / Sauvegarder */}
          {products.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleCalculate}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <DownloadCloud size={20} />
                Analyser le lot
              </button>
              {showResults && (
                <button
                  onClick={handleSaveSimulation}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
                  title="Mémoriser cette simulation"
                >
                  💾 Garder
                </button>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                title="Vider la page"
              >
                🗑️ Vider
              </button>
            </div>
          )}
        </div>

        {/* RÉSULTATS */}
        {showResults && results.length > 0 && (
          <div>
            {/* Résumé */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-6 rounded-xl border border-blue-700">
                <p className="text-sm text-gray-400 mb-2">Coût par Palette</p>
                <p className="text-3xl font-bold text-blue-400">{costPerPalette.toFixed(2)} €</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/30 to-[#1a1a1a] p-6 rounded-xl border border-purple-700">
                <p className="text-sm text-gray-400 mb-2">Score Moyen du Lot</p>
                <p className="text-3xl font-bold text-purple-400">{averageScore} / 20</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-[#1a1a1a] p-6 rounded-xl border border-green-700">
                <p className="text-sm text-gray-400 mb-2">Nombre de Produits</p>
                <p className="text-3xl font-bold text-green-400">{results.length}</p>
              </div>
            </div>

            {/* Tableau des Produits */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#0a0a0a] border-b border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Produit</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Prix Neuf</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Coût Acheté</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Coefficient</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Score /20</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Décision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.id} className="border-b border-gray-800 hover:bg-[#252525] transition">
                        <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-xs">{result.name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">{result.priceNeuf.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-400">{result.costPerProduct.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-sm font-semibold">{result.coefficient.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-white">{result.score.toFixed(1)}</td>
                        <td className="px-4 py-3 text-sm font-semibold">{result.colorLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
