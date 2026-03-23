"use client";
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const UserAvatar = ({ user }: { user: User | undefined }) => (
    <Avatar className="h-9 w-9">
        <AvatarImage src={user?.photoURL} alt={user?.name} />
        <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
    </Avatar>
);
