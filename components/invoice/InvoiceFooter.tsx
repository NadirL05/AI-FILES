import { Invoice } from '@/lib/types';
import {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  formatCurrency,
} from '@/lib/calculations';

type InvoiceFooterProps = {
  invoice: Invoice;
};

export const InvoiceFooter = ({ invoice }: InvoiceFooterProps) => {
  const subtotal = calculateSubtotal(invoice.items);
  const tax = calculateTax(subtotal, invoice.taxRate);
  const total = calculateTotal(subtotal, tax);

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total HT</span>
            <span className="font-semibold">
              {formatCurrency(subtotal, invoice.currency)}
            </span>
          </div>
          {invoice.taxRate > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>TVA ({invoice.taxRate}%)</span>
                <span className="font-semibold">
                  {formatCurrency(tax, invoice.currency)}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between border-t-2 border-gray-300 pt-2 text-base font-bold text-gray-900">
            <span>Total TTC</span>
            <span>{formatCurrency(total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {(invoice.date || invoice.dueDate) && (
        <div className="mt-6 flex justify-between text-sm text-gray-600">
          {invoice.date && (
            <div>
              <span className="font-semibold">Date d'émission :</span>{' '}
              {new Date(invoice.date).toLocaleDateString('fr-FR')}
            </div>
          )}
          {invoice.dueDate && (
            <div>
              <span className="font-semibold">Échéance :</span>{' '}
              {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      )}

      {invoice.notes && (
        <div className="mt-6 border-t pt-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Notes :</span> {invoice.notes}
          </p>
        </div>
      )}
    </div>
  );
};

