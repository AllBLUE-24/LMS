// C:\dev\LMS\frontend\src\types\index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  // Future user properties can be added here
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  // Future lead properties can be added here
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date: string; // ISO 8601 date string
  assigned_to: string; // User ID
  lead_id: string;   // Lead ID
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'In Progress' | 'Completed';
  isCompleted: boolean;

  // Optional nested objects to be included by the backend API
  // This will eliminate the need for client-side lookups.
  assigned_user?: { id: string; name: string; };
  lead?: { id: string; name: string; };
}

