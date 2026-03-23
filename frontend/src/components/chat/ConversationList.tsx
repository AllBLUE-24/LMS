"use client";
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { selectConversation } from '@/store/chatSlice';
import { User, Conversation as ConversationType } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatListItem } from './ChatListItem';
import { UserAvatar } from './UserAvatar';
import { cn } from '@/lib/utils';

export const ConversationList = ({ conversations, users, currentUserId }: { conversations: ConversationType[], users: User[], currentUserId: string }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { selectedConversationId } = useSelector((state: RootState) => state.chat);
    const getUserDetails = (userId: string) => users.find(u => u.uid === userId);

    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => {
            const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0);
            const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });
    }, [conversations]);

    return (
        <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
                {sortedConversations.map(convo => {
                    const otherParticipantId = convo.participants.find((p: string) => p !== currentUserId);
                    const otherUser = getUserDetails(otherParticipantId || '');
                    if (!otherUser) return null;

                    return (
                        <ChatListItem key={convo.id} onClick={() => dispatch(selectConversation(convo.id))} isSelected={selectedConversationId === convo.id}>
                            <UserAvatar user={otherUser} />
                            <div className="flex-1 truncate">
                                <p className="font-semibold truncate">{otherUser.name}</p>
                                <p className={cn("text-sm truncate", selectedConversationId === convo.id ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                                    {convo.last_message?.content || 'No messages yet'}
                                </p>
                            </div>
                        </ChatListItem>
                    );
                })}
            </div>
        </ScrollArea>
    );
};