import { Invoice } from './types';

export function calculateLineTotal(item: { quantity: number; unitPrice: number }): number {
  return item.quantity * item.unitPrice;
}

export function calculateSubtotal(items: Invoice['items']): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return (subtotal * taxRate) / 100;
}

export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

export function formatCurrency(amount: number, currency: 'EUR' | 'USD'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

