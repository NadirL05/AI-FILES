# Variables d'environnement - VoiceInvoice

Ce document liste toutes les variables d'environnement nécessaires pour faire fonctionner VoiceInvoice.

## Variables requises

### 1. DATABASE_URL
**Description** : URL de connexion à la base de données PostgreSQL (Supabase)  
**Format** : `postgresql://user:password@host:port/database`  
**Exemple** : `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`  
**Où la trouver** : Dans votre dashboard Supabase → Settings → Database → Connection string

### 2. OPENAI_API_KEY
**Description** : Clé API OpenAI pour la génération de factures (GPT-4o) et la transcription vocale (Whisper)  
**Format** : `sk-proj-...`  
**Exemple** : `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`  
**Où la trouver** : https://platform.openai.com/api-keys

### 3. RESEND_API_KEY
**Description** : Clé API Resend pour l'envoi d'emails de factures  
**Format** : `re_...`  
**Exemple** : `re_1234567890abcdef`  
**Où la trouver** : https://resend.com/api-keys

## Variables optionnelles

### 4. STRIPE_SECRET_KEY
**Description** : Clé secrète Stripe pour générer des liens de paiement automatiques  
**Format** : `sk_test_...` (test) ou `sk_live_...` (production)  
**Exemple** : `sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`  
**Où la trouver** : https://dashboard.stripe.com/apikeys  
**Note** : Si cette variable n'est pas configurée, les liens de paiement ne seront pas générés automatiquement, mais l'application fonctionnera quand même.

## Configuration dans Vercel

1. Allez sur https://vercel.com
2. Sélectionnez votre projet "ai-files"
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez chaque variable :
   - **Key** : Le nom de la variable (ex: `DATABASE_URL`)
   - **Value** : La valeur de la variable
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
5. Cliquez sur **Save**

## Configuration locale (.env.local)

Pour le développement local, créez un fichier `.env.local` à la racine du projet :

```env
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=sk-proj-...
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_test_...
```

⚠️ **Important** : Ne commitez jamais le fichier `.env.local` dans Git (il est déjà dans `.gitignore`).

## Vérification

Après avoir configuré les variables dans Vercel, vous devez :
1. Redéployer votre application (ou attendre le prochain push)
2. Vérifier que le build réussit sans erreurs liées aux variables manquantes


