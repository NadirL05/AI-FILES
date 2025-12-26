# Fix Prisma PostgreSQL Serverless - "prepared statement already exists"

## Problème
Erreur `prepared statement "s0" already exists (error code 42P05)` dans un environnement serverless (Vercel).

## Cause
Dans un environnement serverless, les connexions PostgreSQL sont réutilisées entre les invocations, et les prepared statements peuvent entrer en conflit si plusieurs instances tentent de créer les mêmes statements.

## Solutions appliquées

### 1. Configuration Prisma optimisée (`lib/db.ts`)
✅ **Singleton pattern amélioré** : Le singleton fonctionne maintenant aussi en production (Vercel)
- Réutilisation de la connexion entre les invocations
- Évite la création de multiples instances de PrismaClient
- Gestion automatique des connexions

✅ **Fonction `prismaQuery` avec retry logic** :
- Gère automatiquement les erreurs "prepared statement already exists" (42P05)
- Retry automatique avec reconnexion en cas d'erreur
- Utilisée dans `app/api/generate/route.ts` pour les requêtes critiques

### 2. Vérification des imports Prisma

✅ **Tous les fichiers utilisent le singleton** :
- `app/api/generate/route.ts` : ✅ `import { prisma, prismaQuery } from '@/lib/db'` (avec retry)
- `app/actions.ts` : ✅ `import { prisma } from '@/lib/db'`
- Aucun `new PrismaClient()` direct trouvé

### 3. Paramètres DATABASE_URL recommandés pour Supabase

**⚠️ IMPORTANT** : Ajoutez ces paramètres à votre `DATABASE_URL` dans Vercel :

```
postgresql://user:password@host:port/database?pgbouncer=true&connection_limit=1&pool_timeout=10
```

**Paramètres importants :**
- `pgbouncer=true` : Active le mode transaction pooling (recommandé pour Supabase)
- `connection_limit=1` : Limite à 1 connexion par instance (crucial pour serverless)
- `pool_timeout=10` : Timeout de 10 secondes pour obtenir une connexion

### 4. Configuration alternative (sans pgbouncer)

Si vous n'utilisez pas pgbouncer :

```
postgresql://user:password@host:port/database?connection_limit=1&pool_timeout=10&connect_timeout=10
```

### 5. Configuration Vercel

Dans Vercel Dashboard → Settings → Environment Variables :

1. Allez dans votre projet
2. Settings → Environment Variables
3. Modifiez `DATABASE_URL` pour ajouter les paramètres :
   ```
   postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1&pool_timeout=10
   ```
4. Redéployez l'application

## Notes importantes

### ❌ NE PAS faire :
- **NE PAS** appeler `prisma.$disconnect()` manuellement dans les API routes serverless
  - Les connexions sont réutilisées entre les invocations
  - Disconnect puis reconnect ralentit les requêtes
  - Le singleton pattern gère déjà les connexions
- **NE PAS** créer plusieurs instances de `PrismaClient`
- **NE PAS** utiliser `new PrismaClient()` directement dans les routes

### ✅ À faire :
- **UTILISER** toujours `import { prisma } from '@/lib/db'` ou `import { prismaQuery } from '@/lib/db'`
- **UTILISER** `prismaQuery()` pour les requêtes critiques dans les API routes (gère automatiquement les retries)
- **UTILISER** le singleton pattern (déjà en place)
- **CONFIGURER** correctement `DATABASE_URL` avec les paramètres de pool
- **RÉUTILISER** les connexions entre les invocations (géré automatiquement)

### 🔧 Utilisation de prismaQuery (pour les requêtes critiques)

Pour les requêtes dans les API routes qui peuvent échouer avec "prepared statement already exists", utilisez `prismaQuery` :

```typescript
import { prismaQuery } from '@/lib/db';

// Au lieu de :
const clients = await prisma.client.findMany({...});

// Utilisez :
const clients = await prismaQuery(() => prisma.client.findMany({...}));
```

La fonction `prismaQuery` gère automatiquement :
- Les erreurs "prepared statement already exists" (42P05)
- Les retries avec reconnexion
- Les timeouts

## Vérification

1. ✅ Tous les fichiers utilisent `import { prisma } from '@/lib/db'`
2. ⚠️ **À FAIRE** : Vérifiez que `DATABASE_URL` dans Vercel contient les paramètres de pool
3. ⚠️ **À FAIRE** : Testez en production (Vercel) pour confirmer que l'erreur est résolue

## Références

- [Prisma Serverless Guide](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

