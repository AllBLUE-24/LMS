"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchMessages, addMessage } from '@/store/chatSlice';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { UserAvatar } from './UserAvatar';

export const ChatPanel = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { messages, selectedConversationId, status: chatStatus } = useSelector((state: RootState) => state.chat);
    const { users } = useSelector((state: RootState) => state.users);
    const { user: currentUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedConversationId) {
            dispatch(fetchMessages(selectedConversationId));
            const token = localStorage.getItem('firebaseIdToken');
            if (!token) return;
            const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/api/v1/chat/ws/${selectedConversationId}?token=${token}`;
            const ws = new WebSocket(wsUrl);

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    dispatch(addMessage(message));
                } catch (error) {
                    console.error("Failed to parse WebSocket message:", error);
                }
            };
            setSocket(ws);
            return () => ws.close();
        }
    }, [selectedConversationId, dispatch]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (socket && newMessage.trim() && selectedConversationId) {
            socket.send(JSON.stringify({ content: newMessage }));
            setNewMessage('');
        }
    };

    const getUserDetails = (userId: string) => users.find(u => u.uid === userId);

    if (!selectedConversationId) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/20">Select a conversation to start chatting</div>;
    }

    if (chatStatus === 'loading') {
        return <div className="flex-1 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>;
    }

    return (
        <div className="flex-1 flex flex-col bg-muted/20">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const sender = getUserDetails(msg.sender_id);
                        const isCurrentUser = msg.sender_id === currentUser?.uid;
                        return (
                            <div key={msg.id} className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
                                {!isCurrentUser && <UserAvatar user={sender} />}
                                <div className={cn("max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow-sm", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-background")}>
                                    <p className="text-sm">{msg.content}</p>
                                    <p className="text-xs text-right mt-1 opacity-70">{format(new Date(msg.timestamp), 'p')}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>
            <div className="p-4 bg-background border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        placeholder="Type a message..."
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};
