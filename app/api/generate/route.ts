import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Invoice } from '@/lib/types';
import { prisma, prismaQuery } from '@/lib/db';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

const getSystemPrompt = (knowledgeBase: string) => `Tu es un assistant intelligent qui aide à créer et modifier des factures à partir de conversations naturelles en français.

Tu dois extraire ou mettre à jour les informations suivantes depuis les instructions de l'utilisateur :
- Informations émetteur (nom, adresse, email)
- Informations client (nom, adresse, email)
- Lignes de facture (description, quantité, prix unitaire)
- Dates (date d'émission, échéance)
- Devise (EUR ou USD)
- Taux de TVA (en pourcentage, ex: 20 pour 20%)
- Notes

=== BASE DE CONNAISSANCES (DONNÉES EXISTANTES) ===
${knowledgeBase}

=== RÈGLES STRICTES POUR UTILISER LA BASE DE CONNAISSANCES ===
1. Si l'utilisateur mentionne un nom de client qui existe dans la base de connaissances ci-dessus, TU DOIS utiliser EXACTEMENT les informations (adresse, email, vatNumber) de la base de données. Ne modifie PAS ces données et ne les invente PAS.
2. Si l'utilisateur mentionne un service/produit (ex: "Consulting", "Développement web") qui existe dans l'historique des items, utilise le prix habituel comme référence pour suggérer un prix unitaire cohérent.
3. Si un client existe dans la base de connaissances mais que l'utilisateur fournit de nouvelles informations, combine-les intelligemment (mais préfère toujours les données de la base de connaissances si elles sont complètes).

IMPORTANT :
1. Ne calcule JAMAIS les totaux (HT, TVA, TTC) - ces calculs sont faits par le code côté serveur
2. Retourne UNIQUEMENT le JSON de la facture complète, pas de texte supplémentaire
3. Si l'utilisateur modifie une facture existante, conserve les données non mentionnées
4. Pour les modifications, utilise les IDs existants des lignes si elles sont mentionnées
5. Génère de nouveaux IDs pour les nouvelles lignes (format UUID)

Format de réponse : JSON strict conforme au type Invoice suivant :
{
  "id": "string",
  "status": "draft" | "finalized",
  "sender": {
    "name": "string",
    "address": "string",
    "email": "string"
  },
  "client": {
    "name": "string",
    "address": "string",
    "email": "string (optionnel)"
  },
  "date": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "items": [
    {
      "id": "string (UUID)",
      "description": "string",
      "quantity": number,
      "unitPrice": number
    }
  ],
  "currency": "EUR" | "USD",
  "taxRate": number (ex: 20 pour 20%),
  "notes": "string"
}`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userMessage, currentInvoice } = body as {
      userMessage: string;
      currentInvoice: Invoice;
    };

    if (!userMessage) {
      return NextResponse.json(
        { error: 'No user message provided' },
        { status: 400 }
      );
    }

    // Récupérer les données de contexte depuis la base de données
    // Utiliser try-catch pour éviter que les erreurs DB bloquent la génération
    let clients: Array<{ name: string; address: string | null; email: string | null; vatNumber: string | null }> = [];
    let allInvoiceItems: Array<{ description: string; unitPrice: number; quantity: number }> = [];

    try {
      [clients, allInvoiceItems] = await Promise.all([
        // Récupérer les 20 derniers clients avec gestion d'erreur retry
        prismaQuery(() =>
          prisma.client.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: {
              name: true,
              address: true,
              email: true,
              vatNumber: true,
            },
          })
        ),
        // Récupérer les 50 derniers InvoiceItems pour avoir une bonne variété
        prismaQuery(() =>
          prisma.invoiceItem.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: {
              description: true,
              unitPrice: true,
              quantity: true,
            },
          })
        ),
      ]);
    } catch (dbError) {
      // Si erreur DB, continuer sans la knowledge base (mode dégradé)
      console.warn('Error fetching knowledge base from DB, continuing without it:', dbError);
      clients = [];
      allInvoiceItems = [];
    }

    // Grouper les items par description unique (garder le plus récent pour chaque description)
    const uniqueItemsMap = new Map<string, { description: string; unitPrice: number; quantity: number }>();
    for (const item of allInvoiceItems) {
      if (!uniqueItemsMap.has(item.description)) {
        uniqueItemsMap.set(item.description, item);
      }
    }
    const invoiceItems = Array.from(uniqueItemsMap.values()).slice(0, 20);

    // Formater la Knowledge Base
    const knowledgeBase = `
CLIENTS EXISTANTS (utilise ces données exactes si un nom correspond) :
${clients.length > 0 
  ? clients.map((client, idx) => 
      `${idx + 1}. ${client.name}${client.address ? ` - Adresse: ${client.address}` : ''}${client.email ? ` - Email: ${client.email}` : ''}${client.vatNumber ? ` - N° TVA: ${client.vatNumber}` : ''}`
    ).join('\n')
  : 'Aucun client enregistré.'
}

SERVICES/PRODUITS HISTORIQUES (prix de référence) :
${invoiceItems.length > 0
  ? invoiceItems.map((item, idx) => 
      `${idx + 1}. ${item.description} - Prix unitaire habituel: ${item.unitPrice}€ (quantité typique: ${item.quantity})`
    ).join('\n')
  : 'Aucun service/produit enregistré.'
}
`;

    // Construire le contexte avec la facture actuelle
    const contextMessage = currentInvoice
      ? `Facture actuelle : ${JSON.stringify(currentInvoice, null, 2)}`
      : 'Aucune facture existante. Crée une nouvelle facture.';

    // Générer le prompt système avec la Knowledge Base
    const systemPrompt = getSystemPrompt(knowledgeBase);

    let completion;
    try {
      completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: contextMessage },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Plus déterministe pour les données structurées
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      const errorMessage = openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error';
      
      // Vérifier si c'est une erreur de clé API
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Clé API OpenAI invalide ou expirée. Vérifiez votre clé dans .env.local' },
          { status: 401 }
        );
      }
      
      // Vérifier si c'est une erreur de quota
      if (errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Quota OpenAI dépassé ou limite de taux atteinte. Réessayez plus tard.' },
          { status: 429 }
        );
      }
      
      throw openaiError; // Relancer pour le catch général
    }

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parser le JSON
    let invoice: Invoice;
    try {
      invoice = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON response from AI' },
        { status: 500 }
      );
    }

    // Validation basique
    if (!invoice.items || !Array.isArray(invoice.items)) {
      invoice.items = [];
    }

    // S'assurer que les IDs existent pour les nouvelles lignes
    invoice.items = invoice.items.map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
    }));

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Generation error:', error);
    
    // Retourner un message d'erreur plus détaillé
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isOpenAIError = errorMessage.includes('API key') || errorMessage.includes('OpenAI');
    
    return NextResponse.json(
      { 
        error: isOpenAIError 
          ? 'Erreur de connexion à OpenAI. Vérifiez votre clé API.'
          : `Erreur lors de la génération: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

