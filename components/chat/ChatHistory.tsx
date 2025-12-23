'use client';

import { useEffect, useRef } from 'react';
import { useInvoiceStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

export function ChatHistory() {
  const messages = useInvoiceStore((state) => state.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll vers le bas quand de nouveaux messages arrivent
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-center text-gray-500">
        <div>
          <p className="mb-2 text-lg font-semibold">Bienvenue sur VoiceInvoice</p>
          <p className="text-sm">
            Commencez par créer une facture en parlant ou en tapant votre message.
          </p>
          <p className="mt-2 text-xs">
            Exemple : "Fais une facture pour Google, 5000€ de coaching"
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-4" ref={scrollRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <Card
              className={`max-w-[80%] p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p
                className={`mt-1 text-xs ${
                  message.role === 'user'
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                }`}
              >
                {message.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </Card>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

