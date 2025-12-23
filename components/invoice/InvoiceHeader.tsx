import { Invoice } from '@/lib/types';

interface InvoiceHeaderProps {
  invoice: Invoice;
}

export function InvoiceHeader({ invoice }: InvoiceHeaderProps) {
  return (
    <div className="mb-8 flex justify-between border-b pb-6">
      <div className="flex-1">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">FACTURE</h2>
        {invoice.sender.name && (
          <div className="space-y-1 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">{invoice.sender.name}</p>
            {invoice.sender.address && <p>{invoice.sender.address}</p>}
            {invoice.sender.email && <p>{invoice.sender.email}</p>}
          </div>
        )}
      </div>
      <div className="flex-1 text-right">
        {invoice.client.name && (
          <div className="space-y-1 text-sm text-gray-600">
            <p className="mb-2 font-semibold text-gray-900">Client</p>
            <p className="font-semibold text-gray-900">{invoice.client.name}</p>
            {invoice.client.address && <p>{invoice.client.address}</p>}
            {invoice.client.email && <p>{invoice.client.email}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

