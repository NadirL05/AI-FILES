'use client';

// 1. On ajoute l'import de 'dynamic'
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Imports normaux (ceux qui ne touchent pas au PDF)
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ResetButton } from '@/components/actions/ResetButton';
import { SendButton } from '@/components/actions/SendButton';
import { PayButton } from '@/components/actions/PayButton';
import { Toaster } from '@/components/ui/sonner';
import { useInvoiceStore } from '@/lib/store';
import { saveInvoice } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Save, Loader2, BarChart3 } from 'lucide-react';
import Link from 'next/link';

// 2. IMPORTS CORRIGÉS (C'est ça qui répare ton bug)
// On dit à Next.js : "Ne charge pas ça sur le serveur, attends le navigateur"

const InvoicePreview = dynamic(
  () => import('@/components/invoice/InvoicePreview').then((mod) => mod.InvoicePreview),
  { 
    ssr: false, // 👈 LA CLÉ DU SUCCÈS
    loading: () => <div className="h-full w-full flex items-center justify-center text-gray-400">Chargement de l&apos;aperçu...</div>
  }
);

const ExportButton = dynamic(
  () => import('@/components/actions/ExportButton').then((mod) => mod.ExportButton),
  { ssr: false }
);

export default function Home() {
  const error = useInvoiceStore((state) => state.error);
  const setError = useInvoiceStore((state) => state.setError);
  const invoice = useInvoiceStore((state) => state.invoice);
  const savedInvoiceId = useInvoiceStore((state) => state.savedInvoiceId);
  const setSavedInvoiceId = useInvoiceStore((state) => state.setSavedInvoiceId);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setTimeout(() => setError(null), 5000);
    }
  }, [error, setError]);

  const handleSave = async () => {
    // Vérifier qu'il y a du contenu à sauvegarder
    if (!invoice.client.name && invoice.items.length === 0) {
      toast.error('Aucune donnée à sauvegarder');
      return;
    }

    setIsSaving(true);
    toast.loading('Sauvegarde en cours...');

    try {
      const result = await saveInvoice(invoice);

      if (result.success) {
        toast.success('Facture sauvegardée !');
        // Stocker l'ID de la facture sauvegardée
        if (result.invoiceId) {
          setSavedInvoiceId(result.invoiceId);
        }
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header avec actions */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b bg-white px-4 sm:px-6 py-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl sm:text-2xl font-bold">VoiceInvoice</h1>
          <nav className="hidden sm:flex gap-4">
            <Link
              href="/"
              className="text-gray-900 bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
            >
              Éditeur
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/clients"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Clients
            </Link>
          </nav>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/dashboard">
            <Button variant="outline" className="hidden sm:flex">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <ResetButton />
          <Button
            onClick={handleSave}
            disabled={isSaving || (!invoice.client.name && invoice.items.length === 0)}
            variant="default"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
          {/* Le bouton Export est maintenant chargé dynamiquement */}
          <ExportButton />
          {/* Bouton Envoyer par Email (visible seulement si la facture a été sauvegardée) */}
          <SendButton
            invoiceId={savedInvoiceId}
            clientEmail={invoice.client.email}
          />
          {/* Bouton Payer maintenant (visible seulement si la facture a un lien de paiement) */}
          <PayButton invoiceId={savedInvoiceId} />
        </div>
      </header>

      {/* Split-screen layout */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Panneau gauche - Chat */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r">
          <ChatPanel />
        </div>

        {/* Panneau droit - Preview */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-50 overflow-y-auto p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-[210mm] shadow-lg bg-white min-h-[297mm]">
             <InvoicePreview />
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}