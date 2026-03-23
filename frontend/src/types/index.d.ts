// FILE: lms-frontend/src/types/index.d.ts
// Centralized TypeScript type definitions for your application data.

// Define a simple User type
export type User = {
  id: string;
  email: string;
  name?: string;
  capabilities?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

// Define the Lead type based on our architecture document
export type Lead = {
  id: string;
  name: string;
  performanceMetric: number | string; // e.g., 10th percentage, qualification score
  source: string; // e.g., "Website", "Referral", "Event"
  location: string;
  demographicTag: string; // e.g., "Open", "SC", "ST", "OBC", "Customer Segment A"
  gender?: 'Male' | 'Female' | 'Other' | string;
  productServiceInterest?: string; // e.g., "Course A", "Product B"
  currentStatus: 'New' | 'Contact Attempt 1' | 'Contact Attempt 2' | 'Contact Attempt 3' | 'Last Attempt' | 'Qualified' | 'Not Qualified' | 'Meeting Scheduled' | 'Converted' | 'Lost';
  leadGeneratorId: string; // User ID of the generator
  nurturingAgentId?: string; // User ID of the nurturing agent
  closingAgentId?: string; // User ID of the closing agent
  potentialScore?: number; // e.g., 1-10
  conversionEase?: 'Easy' | 'Medium' | 'Hard';
  creationDate: Date;
  lastUpdatedDate: Date;
  notes?: { timestamp: Date; userId: string; content: string }[];
  communicationHistory?: { timestamp: Date; type: 'email' | 'whatsapp' | 'call'; details: string; status: string }[];
  tenantId: string;
};

// --- Chat Types ---

export interface Message {
  id?: string;
  conversation_id: string; // To identify which conversation this message belongs to
  sender_id: string;
  content: string;
  timestamp: string; // ISO 8601 date string
  file_url?: string;
  file_type?: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  is_team_chat: boolean;
  team_id?: string;
  last_message?: Message;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

// Add other types as needed, e.g., for forms, API responses, etc.

export type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  timestamp: string;
  link?: string;
  user_id: string;
};
