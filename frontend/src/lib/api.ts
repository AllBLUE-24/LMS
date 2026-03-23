import { apiClient } from './apiClient';
import { db } from '@/context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export const subscribeToNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  if (!userId) return () => {};

const q = query(
    collection(db, "notifications"), 
    where("user_id", "==", userId),
    orderBy("timestamp", "desc") // Sort by timestamp, newest first
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const notifications: any[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    callback(notifications);
  });

  return unsubscribe;
};

export const markAsRead = async (id: string) => {
  const response = await apiClient.put(`/notifications/${id}/read`);
  return response.data;
};

export const getLeadActivities = async (leadId: string) => {
  const response = await apiClient.get(`/leads/${leadId}/activities`);
  return response.data;
};

export const addLeadActivity = async (leadId: string, activityData: any) => {
  const response = await apiClient.post(`/leads/${leadId}/activities`, activityData);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get(`/users/`);
  return response.data;
};

export const inviteUser = async (userData: any) => {
  const response = await apiClient.post('/users/invite', userData);
  return response.data;
};

export const getChatHistory = async (channelId: number) => {
  const response = await apiClient.get(`/chat/channels/${channelId}/messages`);
  return response.data;
};
