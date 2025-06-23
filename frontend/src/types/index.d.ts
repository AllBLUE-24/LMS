// FILE: lms-frontend/src/types/index.d.ts
// Centralized TypeScript type definitions for your application data.

// Define a simple User type
export type User = {
  id: string;
  email: string;
  name?: string;
  role: 'Admin' | 'Lead Generator' | 'Nurturing Agent' | 'Closing Agent';
  createdAt: Date;
  updatedAt: Date;
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
  organizationId: string;
};

// Add other types as needed, e.g., for forms, API responses, etc.
