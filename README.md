# VoiceInvoice - MVP

SaaS de facturation "Generative UI" qui permet de créer, modifier et exporter des factures via une interface conversationnelle (voix et texte), avec visualisation en temps réel.

## 🚀 Fonctionnalités

- **Interface conversationnelle** : Créez des factures en parlant ou en tapant naturellement
- **Reconnaissance vocale** : Utilisez votre micro pour dicter vos factures
- **Prévisualisation en temps réel** : Visualisez votre facture se construire au fur et à mesure
- **Export PDF** : Téléchargez vos factures en PDF professionnel
- **Calculs automatiques** : Totaux HT, TVA et TTC calculés automatiquement et de manière sécurisée

## 🛠️ Stack Technique

- **Frontend** : Next.js 14 (App Router) + React
- **Styling** : Tailwind CSS + Shadcn UI
- **State Management** : Zustand
- **AI** : OpenAI GPT-4o (NLU) + Whisper (STT)
- **PDF** : @react-pdf/renderer

## 📦 Installation

1. Clonez le repository
2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
Créez un fichier `.env.local` à la racine du projet :
```
OPENAI_API_KEY=votre_clé_api_openai
```

4. Lancez le serveur de développement :
```bash
npm run dev
```

5. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur

## 🎯 Utilisation

1. **Créer une facture** : Tapez ou dites quelque chose comme :
   - "Fais une facture pour Google, 5000€ de coaching"
   - "Ajoute une ligne pour développement web, 10 heures à 80€ l'heure"

2. **Modifier une facture** : 
   - "Change la quantité de la ligne 1 à 5"
   - "Modifie le prix unitaire de la première ligne à 100€"

3. **Télécharger** : Cliquez sur "Télécharger PDF" pour exporter votre facture

## 📝 Structure du Projet

```
voiceinvoice/
├── app/
│   ├── api/              # API routes (transcribe, generate)
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Page principale (split-screen)
├── components/
│   ├── chat/             # Composants de conversation
│   ├── invoice/          # Composants de prévisualisation
│   ├── actions/          # Boutons d'action (export, reset)
│   └── ui/               # Composants Shadcn UI
├── lib/
│   ├── store.ts          # Store Zustand
│   ├── types.ts          # Types TypeScript
│   ├── calculations.ts   # Calculs sécurisés
│   └── pdf-generator.ts  # Génération PDF
└── public/               # Assets statiques
```

## 🔒 Sécurité

- Les calculs (HT, TVA, TTC) sont effectués côté code, jamais par l'IA
- Les clés API sont stockées côté serveur uniquement
- Validation stricte des données JSON retournées par l'IA

## 📱 Responsive

L'interface s'adapte automatiquement :
- **Desktop** : Split-screen 50/50 (Chat / Preview)
- **Mobile** : Stack vertical avec panneaux empilés

## 🚢 Déploiement

Le projet est prêt pour le déploiement sur Vercel :

1. Connectez votre repository GitHub à Vercel
2. Ajoutez la variable d'environnement `OPENAI_API_KEY` dans les paramètres Vercel
3. Déployez !

## 📄 Licence

MIT
