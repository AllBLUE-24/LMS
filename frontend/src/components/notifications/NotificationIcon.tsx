"use client";

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useGetNotificationsQuery, useMarkNotificationAsReadMutation } from '@/store/apiSlice';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function NotificationIcon() {
  const { data: notifications = [], isLoading, isError } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60000, // Refetch every 60 seconds
  });
  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notificationId) => {
    try {
      await markAsRead(notificationId).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-full p-2 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-1 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">View notifications</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 font-semibold">Notifications</div>
        <ScrollArea className="h-96">
          {isLoading ? (
            <DropdownMenuItem>Loading...</DropdownMenuItem>
          ) : isError ? (
            <DropdownMenuItem>Error loading notifications</DropdownMenuItem>
          ) : notifications.length === 0 ? (
            <DropdownMenuItem>No new notifications</DropdownMenuItem>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn('flex flex-col items-start gap-2 whitespace-pre-wrap', !notification.is_read && 'bg-accent')}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}