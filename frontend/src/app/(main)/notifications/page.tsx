'use client';

import React from 'react';
import { useGetNotificationsQuery } from '../../../store/apiSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const NotificationsPage = () => {
  const { data: notifications, error, isLoading } = useGetNotificationsQuery();
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    toast.error('Failed to load notifications.');
    return <div>Error loading notifications.</div>;
  }

  const handleNotificationClick = (link: string | null | undefined) => {
    if (link) {
      router.push(link);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <div className="space-y-4">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg cursor-pointer ${
                notification.is_read ? 'bg-muted' : 'bg-card'
              } hover:bg-muted/80`}
              onClick={() => handleNotificationClick(notification.link)}
            >
              <p className="font-semibold">{notification.message}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p>No notifications found.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
