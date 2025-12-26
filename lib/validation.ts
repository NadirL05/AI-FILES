import { z } from 'zod';

// Validation email avec regex robuste
export const emailSchema = z
  .string()
  .email('Adresse email invalide')
  .max(255, 'L\'adresse email est trop longue')
  .toLowerCase()
  .trim();

// Validation des montants
export const amountSchema = z
  .number()
  .positive('Le montant doit être positif')
  .max(999999999.99, 'Le montant est trop élevé')
  .refine((val) => !isNaN(val) && isFinite(val), {
    message: 'Le montant doit être un nombre valide',
  });

// Validation du taux de TVA
export const taxRateSchema = z
  .number()
  .min(0, 'Le taux de TVA ne peut pas être négatif')
  .max(100, 'Le taux de TVA ne peut pas dépasser 100%')
  .refine((val) => !isNaN(val) && isFinite(val), {
    message: 'Le taux de TVA doit être un nombre valide',
  });

// Validation de la devise
export const currencySchema = z.enum(['EUR', 'USD'], {
  message: 'La devise doit être EUR ou USD',
});

// Validation des dates
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
  .refine(
    (date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    },
    { message: 'Date invalide' }
  );

// Validation du message utilisateur
export const userMessageSchema = z
  .string()
  .min(1, 'Le message ne peut pas être vide')
  .max(5000, 'Le message est trop long (maximum 5000 caractères)')
  .trim();

// Validation des items de facture
export const invoiceItemSchema = z.object({
  id: z.string().uuid('ID invalide'),
  description: z
    .string()
    .min(1, 'La description est requise')
    .max(500, 'La description est trop longue'),
  quantity: z
    .number()
    .positive('La quantité doit être positive')
    .max(999999, 'La quantité est trop élevée'),
  unitPrice: amountSchema,
});

// Validation de la facture complète
export const invoiceSchema = z.object({
  id: z.string().optional(),
  status: z.enum(['draft', 'finalized']).optional(),
  sender: z
    .object({
      name: z.string().min(1).max(255),
      address: z.string().max(500).optional(),
      email: emailSchema.optional(),
    })
    .optional(),
  client: z.object({
    name: z.string().min(1, 'Le nom du client est requis').max(255),
    address: z.string().max(500).optional(),
    email: emailSchema.optional(),
  }),
  date: dateSchema,
  dueDate: dateSchema,
  items: z.array(invoiceItemSchema).min(1, 'Au moins un item est requis'),
  currency: currencySchema,
  taxRate: taxRateSchema,
  notes: z.string().max(2000).optional(),
});

// Validation du fichier audio
export const audioFileSchema = z.object({
  size: z.number().max(25 * 1024 * 1024, 'Le fichier audio ne peut pas dépasser 25MB'),
  type: z
    .string()
    .refine(
      (type) =>
        type.startsWith('audio/') ||
        type === 'audio/webm' ||
        type === 'audio/mp3' ||
        type === 'audio/wav' ||
        type === 'audio/mpeg' ||
        type === 'audio/ogg',
      { message: 'Type de fichier audio non supporté' }
    ),
});

// Fonction helper pour échapper le HTML (prévention XSS)
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

// Fonction pour valider un email avec regex (peut être utilisée côté client)
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
}

