"use client";
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { useGetConversationsQuery, useGetUsersQuery } from '@/store/apiSlice';
import { selectConversation } from '@/store/chatSlice';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users } from 'lucide-react';
import { ConversationList } from '@/components/chat/ConversationList';
import { UserList } from '@/components/chat/UserList';
import { ChatPanel } from '@/components/chat/ChatPanel';

const ChatPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'conversations' | 'users'>('conversations');

    // --- RTK Query Hooks ---
    const { data: conversations = [], isLoading: chatLoading, error: chatError } = useGetConversationsQuery();
    const { data: users = [], isLoading: usersLoading, error: usersError } = useGetUsersQuery();

    useEffect(() => {
        // Logic to auto-select a "self-conversation" if it exists
        if (currentUser && conversations.length > 0) {
            const selfConversation = conversations.find((c: any) => c.participants.length === 1 && c.participants[0] === currentUser.uid);
            if (selfConversation) {
                dispatch(selectConversation(selfConversation.id));
            }
        }
    }, [currentUser, conversations, dispatch]);

    const isLoading = usersLoading || chatLoading;

    if (!currentUser || isLoading) {
        return (
            <div className="flex h-[calc(100vh-80px)] items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }
    
    const combinedError = chatError || usersError;
    if (combinedError) {
        return <div className="text-red-500 p-4">Error loading data. Please try again.</div>;
    }

    return (
        <div className="flex h-[calc(100vh-80px)] border rounded-lg overflow-hidden">
            <div className="w-1/3 xl:w-1/4 border-r flex flex-col bg-background">
                <div className="p-2 border-b">
                    <div className="grid grid-cols-2 gap-1">
                        <Button variant={activeTab === 'conversations' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('conversations')}>
                            <MessageSquare className="mr-2 h-4 w-4"/> Chats
                        </Button>
                        <Button variant={activeTab === 'users' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('users')}>
                            <Users className="mr-2 h-4 w-4"/> Users
                        </Button>
                    </div>
                </div>
                {activeTab === 'conversations' ? (
                    <ConversationList conversations={conversations} users={users} currentUserId={currentUser.uid} />
                ) : (
                    <UserList users={users} currentUserId={currentUser.uid} />
                )}
            </div>
            <div className="flex-1 flex flex-col">
                <ChatPanel />
            </div>
        </div>
    );
};

export default ChatPage;