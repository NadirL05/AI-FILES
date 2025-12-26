'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useInvoiceStore } from '@/lib/store';
import { generatePDF } from '@/lib/pdf-generator';
import { toast } from 'sonner';

type ExportButtonProps = Record<string, never>;

export const ExportButton = (_props: ExportButtonProps) => {
  const invoice = useInvoiceStore((state) => state.invoice);

  const handleExport = async () => {
    try {
      toast.loading('Génération du PDF...');
      await generatePDF(invoice);
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const hasContent = invoice.items.length > 0 || invoice.client.name || invoice.sender.name;

  return (
    <Button onClick={handleExport} disabled={!hasContent} variant="default">
      <Download className="mr-2 h-4 w-4" />
      Télécharger PDF
    </Button>
  );
};

