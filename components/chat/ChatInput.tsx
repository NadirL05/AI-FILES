'use client';

import { useState, useEffect } from 'react';
import { useInvoiceStore } from '@/lib/store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { toast } from 'sonner';

type ChatInputProps = Record<string, never>;

export const ChatInput = (_props: ChatInputProps) => {
  const [input, setInput] = useState('');
  const { invoice, addMessage, updateInvoice, setProcessingState, setError } =
    useInvoiceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Écouter les transcriptions vocales
  useEffect(() => {
    const handleVoiceTranscription = (event: CustomEvent<string>) => {
      setInput(event.detail);
      handleSubmit(event.detail);
    };

    window.addEventListener('voice-transcription', handleVoiceTranscription as EventListener);
    return () => {
      window.removeEventListener('voice-transcription', handleVoiceTranscription as EventListener);
    };
  }, []);

  const handleSubmit = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isSubmitting) return;

    // Validation de la longueur du message (max 5000 caractères)
    if (message.length > 5000) {
      toast.error('Le message est trop long (maximum 5000 caractères)');
      return;
    }

    const messageToSend = message;
    setInput('');
    setIsSubmitting(true);
    addMessage('user', messageToSend);
    setProcessingState('processing');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: messageToSend,
          currentInvoice: invoice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      updateInvoice(data.invoice);
      addMessage('assistant', 'Facture mise à jour avec succès.');
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur lors de la génération de la facture';
      setError(errorMessage);
      toast.error(errorMessage);
      addMessage('assistant', 'Désolé, une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
      setProcessingState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 border-t p-4">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tapez votre message ou utilisez le micro..."
        className="min-h-[60px] resize-none"
        disabled={isSubmitting}
      />
      <div className="flex flex-col gap-2">
        <VoiceRecorder />
        <Button
          onClick={() => handleSubmit()}
          disabled={!input.trim() || isSubmitting}
          size="icon"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

