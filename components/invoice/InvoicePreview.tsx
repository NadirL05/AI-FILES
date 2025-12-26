'use client';

import { useInvoiceStore } from '@/lib/store';
import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceItems } from './InvoiceItems';
import { InvoiceFooter } from './InvoiceFooter';

type InvoicePreviewProps = Record<string, never>;

export const InvoicePreview = (_props: InvoicePreviewProps) => {
  const invoice = useInvoiceStore((state) => state.invoice);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 p-4 sm:p-8">
      {/* Container A4 stylisé */}
      <div className="mx-auto w-full max-w-[210mm] bg-white shadow-lg">
        <div className="p-6 sm:p-12">
          <InvoiceHeader invoice={invoice} />
          <InvoiceItems items={invoice.items} currency={invoice.currency} />
          <InvoiceFooter invoice={invoice} />
        </div>
      </div>
    </div>
  );
};

