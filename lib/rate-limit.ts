import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialiser Redis (utilise UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN)
// Si non configuré, on utilise un rate limiter en mémoire (fallback)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Rate limiter pour les routes API génériques
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requêtes par minute
    analytics: true,
  });
}

// Rate limiter en mémoire (fallback si Upstash n'est pas configuré)
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Nettoyer les requêtes anciennes
    const validRequests = requests.filter((time) => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = validRequests[0];
      const reset = oldestRequest + this.windowMs;
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: Math.floor(reset / 1000),
      };
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validRequests.length,
      reset: Math.floor((now + this.windowMs) / 1000),
    };
  }
}

// Rate limiters spécifiques
const generateRateLimiter = ratelimit
  ? ratelimit
  : new InMemoryRateLimiter(5, 60 * 1000); // 5 requêtes par minute pour /api/generate

const transcribeRateLimiter = ratelimit
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requêtes par minute
      analytics: true,
    })
  : new InMemoryRateLimiter(10, 60 * 1000); // 10 requêtes par minute pour /api/transcribe

// Fonction helper pour obtenir l'identifiant du client (IP ou autre)
export function getClientIdentifier(request: Request): string {
  // En production, utiliser l'IP réelle depuis les headers Vercel
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  return ip;
}

// Rate limiter pour /api/generate (coûteux en OpenAI)
export async function checkGenerateRateLimit(
  request: Request
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const identifier = getClientIdentifier(request);
  if (ratelimit && redis) {
    return await generateRateLimiter.limit(identifier);
  }
  return await (generateRateLimiter as InMemoryRateLimiter).limit(identifier);
}

// Rate limiter pour /api/transcribe
export async function checkTranscribeRateLimit(
  request: Request
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const identifier = getClientIdentifier(request);
  if (ratelimit && redis) {
    return await transcribeRateLimiter.limit(identifier);
  }
  return await (transcribeRateLimiter as InMemoryRateLimiter).limit(identifier);
}

