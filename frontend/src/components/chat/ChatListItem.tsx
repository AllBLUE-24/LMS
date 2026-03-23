"use client";
import { cn } from '@/lib/utils';

export const ChatListItem = ({ onClick, isSelected, children, key }: { onClick: () => void, isSelected: boolean, children: React.ReactNode, key: string }) => (
    <div
        key={key}
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
            isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
        )}
    >
        {children}
    </div>
);
