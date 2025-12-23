'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';
import { getInvoicePaymentLink } from '@/app/actions';
import { toast } from 'sonner';

interface PayButtonProps {
  invoiceId: string | null;
}

export function PayButton({ invoiceId }: PayButtonProps) {
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      setIsLoading(true);
      getInvoicePaymentLink(invoiceId)
        .then((result) => {
          if (result?.paymentLink) {
            setPaymentLink(result.paymentLink);
          }
        })
        .catch((error) => {
          console.error('Error fetching payment link:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [invoiceId]);

  if (!invoiceId || !paymentLink) {
    return null;
  }

  const handlePay = () => {
    if (paymentLink) {
      window.open(paymentLink, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Lien de paiement non disponible');
    }
  };

  return (
    <Button onClick={handlePay} variant="default" className="bg-green-600 hover:bg-green-700">
      <CreditCard className="mr-2 h-4 w-4" />
      Payer maintenant
      <ExternalLink className="ml-2 h-3 w-3" />
    </Button>
  );
}

