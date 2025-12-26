import { Invoice } from '@/lib/types';
import { calculateLineTotal } from '@/lib/calculations';

type InvoiceItemsProps = {
  items: Invoice['items'];
  currency: Invoice['currency'];
};

export const InvoiceItems = ({ items, currency }: InvoiceItemsProps) => {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        Aucune ligne de facture. Commencez par ajouter des prestations.
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Description
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              Quantité
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              Prix unitaire
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const lineTotal = calculateLineTotal(item);
            return (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {item.description}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-600">
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-600">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency,
                  }).format(item.unitPrice)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency,
                  }).format(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

