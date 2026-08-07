import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Empêche le cache Next.js

export async function POST(request: NextRequest) {
  console.log("🚀 [API SCAN] Début du traitement...");
  
  try {
    const MINDEE_API_KEY = process.env.NEXT_PUBLIC_MINDEE_API_KEY;
    
    if (!MINDEE_API_KEY) {
      console.error("❌ Clé API manquante");
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error("❌ Aucun fichier reçu");
      return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });
    }

    console.log(`📄 Fichier: ${file.name} | Taille: ${file.size} bytes | Type: ${file.type}`);

    // Conversion en Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Préparation FormData pour Mindee
    const mindeeFormData = new FormData();
    mindeeFormData.append('document', new Blob([buffer], { type: file.type }), file.name);

    // URL Mindee Expense Receipts V4 (la plus stable)
    const MINDEE_URL = 'https://api.mindee.net/v1/products/mindee/expense_receipts/v4/predict';
    
    console.log(`🌐 Appel Mindee: ${MINDEE_URL}`);
    console.log(` Clé API: ${MINDEE_API_KEY.substring(0, 10)}...`);

    const response = await fetch(MINDEE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${MINDEE_API_KEY}`
        // NE PAS mettre Content-Type, fetch le gère automatiquement avec FormData
      },
      body: mindeeFormData
    });

    console.log(`📡 Réponse Mindee - Status: ${response.status}`);

    // Lecture de la réponse brute pour debug
    const responseText = await response.text();
    console.log(`📝 Réponse brute (${responseText.length} chars):`, responseText.substring(0, 500));

    if (!response.ok) {
      throw new Error(`Mindee API Error ${response.status}: ${responseText}`);
    }

    // Parsing JSON sécurisé
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("❌ Erreur parsing JSON:", parseError);
      throw new Error(`Réponse Mindee invalide (pas du JSON): ${responseText.substring(0, 200)}`);
    }

    console.log("✅ Données Mindee reçues:", JSON.stringify(data));

    // Extraction des données
    const prediction = data.document?.inference?.prediction || {};
    
    const result = {
      supplier: prediction.merchant_name || prediction.supplier?.name || 'Inconnu',
      amount: prediction.total_amount?.value || 0,
      date: prediction.date?.value || '',
      time: prediction.time?.value || ''
    };

    console.log("📊 Résultat extrait:", result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("💥 ERREUR CRITIQUE:", error.message);
    console.error("Stack:", error.stack);
    
    return NextResponse.json({ 
      error: error.message || "Erreur lors de l'analyse OCR" 
    }, { status: 500 });
  }
}