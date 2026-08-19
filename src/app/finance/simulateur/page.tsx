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
  totalPurchasePrice: number;
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
  const [totalCostAchat, setTotalCostAchat] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [savedSimulation, setSavedSimulation] = useState<any>(null);

  // Filtres
  const [searchBrand, setSearchBrand] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');

  // Extraire les marques uniques
  const extractBrands = (prods: Product[]) => {
    const brands = new Set<string>();
    prods.forEach(prod => {
      // Extraire la marque depuis le nom (premier mot ou premieres lettres majuscules)
      const words = prod.name.split(' ');
      if (words.length > 0) {
        brands.add(words[0]); // Prendre le premier mot comme marque
      }
    });
    return Array.from(brands).sort();
  };

  const brands = extractBrands(products);

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

        // Lire tous les produits à partir de la ligne 0
        for (let i = 0; i < json.length; i++) {
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
    const coefficientPercent = coefficient * 100;
    let score = 20;

    // Seuils logiques basés sur le coefficient d'achat
    if (coefficientPercent < 8) {
      score = 20; // Excellent
    } else if (coefficientPercent < 13) {
      // Interpolation linéaire : 8% = 17, 13% = 15
      score = 17 - ((coefficientPercent - 8) / 5) * 2;
    } else if (coefficientPercent < 20) {
      // Interpolation : 13% = 15, 20% = 12
      score = 15 - ((coefficientPercent - 13) / 7) * 3;
    } else if (coefficientPercent < 35) {
      // Interpolation : 20% = 12, 35% = 8
      score = 12 - ((coefficientPercent - 20) / 15) * 4;
    } else if (coefficientPercent < 50) {
      // Interpolation : 35% = 8, 50% = 4
      score = 8 - ((coefficientPercent - 35) / 15) * 4;
    } else {
      score = 4; // Mauvais
    }

    const finalScore = Math.max(0, Math.min(20, Math.round(score * 10) / 10));

    let color: 'red' | 'orange' | 'yellow' | 'green';
    if (finalScore < 8) color = 'red';
    else if (finalScore < 12) color = 'orange';
    else if (finalScore < 16) color = 'yellow';
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
    setTotalCostAchat(0);
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
      costPerPalette,
      totalPieces: products.length
    };
    setSavedSimulation(simulation);
    localStorage.setItem('lastSimulation', JSON.stringify(simulation));
    alert('✅ Simulation sauvegardée !');
  };

  const handleCalculate = () => {
    if (!totalPrice || !shippingCost || !palettes || products.length === 0) {
      alert('Veuillez charger un fichier et remplir tous les champs');
      return;
    }

    const total = parseFloat(totalPrice);
    const shipping = parseFloat(shippingCost);
    const fees = parseFloat(feesPercent);
    const paletteCount = parseInt(palettes);
    const pieces = products.length;

    if (isNaN(total) || isNaN(shipping) || isNaN(fees) || isNaN(paletteCount) || total <= 0 || shipping < 0 || fees < 0 || pieces <= 0) {
      alert('Valeurs invalides');
      return;
    }

    // Coût par palette
    const costPerPalette = (total + shipping) / paletteCount;
    setCostPerPalette(costPerPalette);

    // Coût total avec frais
    const feeAmount = total * (fees / 100);
    const totalCost = total + shipping + feeAmount;
    setTotalCostAchat(totalCost);

    // Prix neuf total
    const totalPriceNeuf = products.reduce((sum, p) => sum + p.priceNeuf, 0);

    // Coefficient = (Frais Port + Frais Enchère) / Prix Neuf Total × 100
    const coefficient = totalPriceNeuf > 0 ? ((shipping + feeAmount) / totalPriceNeuf) * 100 : 0;

    // Frais par pièce
    const shippingPerPiece = shipping / pieces;
    const feePerPiece = feeAmount / pieces;

    // Calculer les résultats
    const newResults: SimulationResult[] = products.map((product) => {
      // Coût d'achat = (Prix Neuf × Coefficient %) + Frais Port/pièce + Frais Enchère/pièce
      const costPerProduct = (product.priceNeuf * (coefficient / 100)) + shippingPerPiece + feePerPiece;

      const { score, color } = calculateScore(coefficient / 100, product.priceNeuf);

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
        costPerProduct: costPerProduct,
        totalPurchasePrice: totalCost,
        coefficient: coefficient,
        score: score,
        color: color,
        colorLabel: colorLabels[color]
      };
    });

    setResults(newResults);
    setShowResults(true);
  };

  const totalPriceNeuf = products.length > 0
    ? products.reduce((sum, p) => sum + p.priceNeuf, 0)
    : 0;

  // Filtrer les résultats
  const filteredResults = results.filter((r) => {
    const matchBrand = !searchBrand || r.name.toLowerCase().includes(searchBrand.toLowerCase());
    const matchMinPrice = !filterMinPrice || r.costPerProduct >= parseFloat(filterMinPrice);
    const matchMaxPrice = !filterMaxPrice || r.costPerProduct <= parseFloat(filterMaxPrice);
    return matchBrand && matchMinPrice && matchMaxPrice;
  });

  const averageScore = filteredResults.length > 0
    ? (filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length).toFixed(1)
    : 0;

  const averageCoefficient = totalPriceNeuf > 0 && totalCostAchat > 0
    ? ((totalCostAchat / totalPriceNeuf) * 100).toFixed(1)
    : 0;

  const pricePiece = filteredResults.length > 0
    ? (filteredResults[0]?.costPerProduct || 0).toFixed(2)
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
            <>
              {/* Affichage du Prix Neuf Total */}
              <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 mb-4 text-sm">
                <span className="text-gray-400">📊 Prix Neuf Total du Lot: </span>
                <span className="font-bold text-green-400">{totalPriceNeuf.toFixed(2)} €</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

                {/* Prix Total */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Prix Total (€)</label>
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
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Palettes</label>
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
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Frais Port (€)</label>
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
            </>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
              <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] p-4 rounded-xl border border-blue-700">
                <p className="text-xs text-gray-400 mb-2">Coût par Palette</p>
                <p className="text-2xl font-bold text-blue-400">{costPerPalette.toFixed(2)} €</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-900/30 to-[#1a1a1a] p-4 rounded-xl border border-cyan-700">
                <p className="text-xs text-gray-400 mb-2">Prix Total d'Achat</p>
                <p className="text-2xl font-bold text-cyan-400">{showResults && results.length > 0 ? (results[0]?.totalPurchasePrice || 0).toFixed(2) : '0'} €</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/30 to-[#1a1a1a] p-4 rounded-xl border border-purple-700">
                <p className="text-xs text-gray-400 mb-2">Score Moyen</p>
                <p className="text-2xl font-bold text-purple-400">{averageScore} / 20</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-[#1a1a1a] p-4 rounded-xl border border-green-700">
                <p className="text-xs text-gray-400 mb-2">Produits</p>
                <p className="text-2xl font-bold text-green-400">{filteredResults.length}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-900/30 to-[#1a1a1a] p-4 rounded-xl border border-orange-700">
                <p className="text-xs text-gray-400 mb-2">Coefficient Moyen (%)</p>
                <p className="text-2xl font-bold text-orange-400">{averageCoefficient}%</p>
              </div>
              <div className="bg-gradient-to-br from-pink-900/30 to-[#1a1a1a] p-4 rounded-xl border border-pink-700">
                <p className="text-xs text-gray-400 mb-2">Prix par Pièce</p>
                <p className="text-2xl font-bold text-pink-400">{pricePiece} €</p>
              </div>
            </div>

            {/* Barre de filtrage */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">🔍 Filtrer par Marque</label>
                  <select
                    value={searchBrand}
                    onChange={(e) => setSearchBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white text-sm"
                  >
                    <option value="">Toutes les marques</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">💰 Prix Min (€)</label>
                  <input
                    type="number"
                    placeholder="Ex: 100"
                    value={filterMinPrice}
                    onChange={(e) => setFilterMinPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">💰 Prix Max (€)</label>
                  <input
                    type="number"
                    placeholder="Ex: 500"
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded text-white text-sm"
                  />
                </div>
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Prix Total</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Coefficient</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Score /20</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Décision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr key={result.id} className="border-b border-gray-800 hover:bg-[#252525] transition">
                        <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-xs">{result.name}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-white">{result.priceNeuf.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-400">{result.costPerProduct.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-400">{result.totalPurchasePrice.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-sm font-semibold text-orange-400">{result.coefficient.toFixed(1)}%</td>
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
