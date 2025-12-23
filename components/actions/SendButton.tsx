'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';
import { sendInvoiceEmail } from '@/app/actions';
import { toast } from 'sonner';

interface SendButtonProps {
  invoiceId: string | null;
  clientEmail?: string;
}

export function SendButton({ invoiceId, clientEmail }: SendButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(clientEmail || '');
  const [isSending, setIsSending] = useState(false);

  // Mettre à jour l'email quand clientEmail change
  useEffect(() => {
    if (clientEmail) {
      setEmail(clientEmail);
    }
  }, [clientEmail]);

  // Ne pas afficher le bouton si la facture n'a pas été sauvegardée
  if (!invoiceId) {
    return null;
  }

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    setIsSending(true);
    toast.loading('Envoi en cours...');

    try {
      const result = await sendInvoiceEmail(invoiceId, email);

      if (result.success) {
        toast.success('Facture envoyée avec succès !');
        setOpen(false);
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Send className="mr-2 h-4 w-4" />
          Envoyer par Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Envoyer la facture</DialogTitle>
          <DialogDescription>
            Entrez l&apos;adresse email du destinataire pour envoyer la facture.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="client@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSending}
          >
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

