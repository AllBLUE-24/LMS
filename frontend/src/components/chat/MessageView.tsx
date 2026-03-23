"use client";

import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Mock data - replace with actual messages from the store
const messages = [
  { id: '1', sender: 'Alice', text: 'Hey, how is the new design coming along?', timestamp: '10:30 AM', avatar: '/avatars/01.png', isCurrentUser: false },
  { id: '2', sender: 'You', text: 'It\'s going great! I should have a draft ready for you by EOD.', timestamp: '10:31 AM', avatar: '/avatars/me.png', isCurrentUser: true },
  { id: '3', sender: 'Alice', text: 'Awesome, looking forward to it!', timestamp: '10:32 AM', avatar: '/avatars/01.png', isCurrentUser: false },
  { id: '4', sender: 'You', text: 'I\'ve also integrated the new analytics library you mentioned.', timestamp: '10:33 AM', avatar: '/avatars/me.png', isCurrentUser: true },
];

export const MessageView = () => {
  const { selectedConversationId } = useSelector((state: RootState) => state.chat);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!selectedConversationId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a conversation to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center space-x-4">
        <Avatar>
            <AvatarImage src="/avatars/01.png" alt="Alice" />
            <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <div>
            <h2 className="text-lg font-bold text-foreground">Alice</h2>
            <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </div>

      {/* Message Area */}
      <div ref={scrollRef} className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-3 max-w-lg",
              msg.isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={msg.avatar} alt={msg.sender} />
              <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "rounded-lg px-4 py-2 shadow-sm",
                msg.isCurrentUser
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none"
              )}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs text-right mt-1 opacity-70">{msg.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
