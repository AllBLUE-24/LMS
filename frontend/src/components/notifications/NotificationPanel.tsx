"use client";
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '@/store/apiSlice';
import { useRouter } from 'next/navigation';

interface NotificationPanelProps {
  closePanel: () => void;
}

const NotificationPanel = ({ closePanel }: NotificationPanelProps) => {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useGetNotificationsQuery();
  const [markAsRead] = useMarkNotificationAsReadMutation();

  const handleNotificationClick = async (id: string, link: string) => {
    try {
      await markAsRead(id).unwrap();
      router.push(link);
      closePanel();
    } catch (error) {
      console.error("Failed to mark notification as read or redirect:", error);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent click from bubbling up to the parent div
    try {
      await markAsRead(id).unwrap();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-background text-foreground rounded-lg shadow-lg z-20 border">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">Notifications</h3>
        <Button variant="ghost" size="icon" onClick={closePanel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[300px]">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            You have no new notifications.
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification: any) => (
              <div 
                key={notification.id} 
                className={`p-4 cursor-pointer ${notification.is_read ? 'bg-muted/50' : 'bg-background hover:bg-muted/50'}`}
                onClick={() => handleNotificationClick(notification.id, notification.link)}
              >
                <p className="text-sm">{notification.message}</p>
                {!notification.is_read && (
                  <button onClick={(e) => handleMarkAsRead(e, notification.id)} className="text-xs text-primary hover:underline mt-2 font-semibold">
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationPanel;
