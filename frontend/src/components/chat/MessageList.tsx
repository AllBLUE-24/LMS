
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface ChatMessage {
    id: number;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
}

interface MessageListProps {
    messages: ChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
    return (
        <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start space-x-4">
                        <Avatar>
                            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${msg.username}`} />
                            <AvatarFallback>{msg.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <div className="flex items-center space-x-2">
                                <p className="font-semibold">{msg.username}</p>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(msg.timestamp), 'p')}
                                </p>
                            </div>
                            <p className="text-sm">{msg.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};
