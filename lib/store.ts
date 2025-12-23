import { create } from 'zustand';
import { Invoice, ChatMessage, ProcessingState } from './types';
import { v4 as uuidv4 } from 'uuid';

interface InvoiceStore {
  // State
  invoice: Invoice;
  messages: ChatMessage[];
  processingState: ProcessingState;
  error: string | null;
  savedInvoiceId: string | null; // ID de la facture sauvegardée en DB

  // Actions
  updateInvoice: (updates: Partial<Invoice>) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  resetInvoice: () => void;
  setProcessingState: (state: ProcessingState) => void;
  setError: (error: string | null) => void;
  setSavedInvoiceId: (id: string | null) => void;
}

const createDefaultInvoice = (): Invoice => ({
  id: uuidv4(),
  status: 'draft',
  sender: {
    name: '',
    address: '',
    email: '',
  },
  client: {
    name: '',
    address: '',
    email: '',
  },
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
  items: [],
  currency: 'EUR',
  taxRate: 20,
  notes: '',
});

export const useInvoiceStore = create<InvoiceStore>((set) => ({
  invoice: createDefaultInvoice(),
  messages: [],
  processingState: 'idle',
  error: null,
  savedInvoiceId: null,

  updateInvoice: (updates) =>
    set((state) => ({
      invoice: { ...state.invoice, ...updates },
    })),

  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: uuidv4(),
          role,
          content,
          timestamp: new Date(),
        },
      ],
    })),

  resetInvoice: () =>
    set({
      invoice: createDefaultInvoice(),
      messages: [],
      error: null,
      processingState: 'idle',
      savedInvoiceId: null,
    }),

  setProcessingState: (state) =>
    set({ processingState: state }),

  setError: (error) =>
    set({ error }),

  setSavedInvoiceId: (id) =>
    set({ savedInvoiceId: id }),
}));

