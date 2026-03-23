"use client";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { selectConversation, startConversation } from '@/store/chatSlice';
import { User } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatListItem } from './ChatListItem';
import { UserAvatar } from './UserAvatar';

export const UserList = ({ users, currentUserId }: { users: User[], currentUserId: string }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { conversations } = useSelector((state: RootState) => state.chat);

    const handleUserClick = (userId: string) => {
        const existingConvo = conversations.find(c => c.participants.includes(userId) && c.participants.length === 2);
        if (existingConvo) {
            dispatch(selectConversation(existingConvo.id));
        } else {
            dispatch(startConversation(userId));
        }
    };

    const otherUsers = users.filter(u => u.uid !== currentUserId);
    const currentUser = users.find(u => u.uid === currentUserId);

    return (
        <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
                {currentUser && (
                    <ChatListItem key={currentUser.uid} onClick={() => handleUserClick(currentUser.uid)} isSelected={false}>
                        <UserAvatar user={currentUser} />
                        <p className="font-semibold truncate">{currentUser.name} (You)</p>
                    </ChatListItem>
                )}
                {otherUsers.map(user => (
                    <ChatListItem key={user.uid} onClick={() => handleUserClick(user.uid)} isSelected={false}>
                        <UserAvatar user={user} />
                        <p className="font-semibold truncate">{user.name}</p>
                    </ChatListItem>
                ))}
            </div>
        </ScrollArea>
    );
};
