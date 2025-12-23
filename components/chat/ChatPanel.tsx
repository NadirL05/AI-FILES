'use client';

import { ChatHistory } from './ChatHistory';
import { ChatInput } from './ChatInput';

export function ChatPanel() {
  return (
    <div className="flex h-full flex-col border-r bg-gray-50">
      <div className="border-b bg-white p-4">
        <h2 className="text-lg font-semibold">Conversation</h2>
      </div>
      <div className="flex-1 overflow-hidden p-4">
        <ChatHistory />
      </div>
      <ChatInput />
    </div>
  );
}

