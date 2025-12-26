export type Invoice = {
  id: string;
  status: 'draft' | 'finalized';
  sender: {
    name: string;
    address: string;
    email: string;
  };
  client: {
    name: string;
    address: string;
    email?: string;
  };
  date: string; // ISO Date
  dueDate: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  currency: 'EUR' | 'USD';
  taxRate: number; // ex: 20 pour 20%
  notes: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type ProcessingState = 'idle' | 'listening' | 'transcribing' | 'processing' | 'error';

export const InvoiceStatusMap = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
} as const;

export type InvoiceStatus = typeof InvoiceStatusMap[keyof typeof InvoiceStatusMap];

