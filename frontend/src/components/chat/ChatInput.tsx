// FILE: frontend/src/components/chat/ChatInput.tsx
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, SendHorizonal } from 'lucide-react';

export const ChatInput = () => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      // Dispatch send message action here
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-border bg-background">
      <div className="relative flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        <Input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 pr-20" // Add padding to the right for the button
        />
        <Button
          onClick={handleSend}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          size="sm"
        >
          Send
          <SendHorizonal className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
