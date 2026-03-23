"use client";

import React, { useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, Phone, MapPin, CalendarDays, User, Tag, Info } from 'lucide-react';
import { format } from 'date-fns';
import { usePageTitle } from '@/context/PageTitleContext';
import { Timeline } from '@/components/leads/Timeline';
import { useGetLeadQuery, useGetLeadActivitiesQuery, useGetUsersQuery } from '@/store/apiSlice';
import { useAuth } from '@/context/AuthContext';

const LeadProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const lead_id = params.lead_id as string;
  const { setPageTitle } = usePageTitle();
  const { lmsUser } = useAuth();

  const isAdmin = lmsUser?.capabilities?.includes('is_admin');
  const canNurture = lmsUser?.capabilities?.includes('can_nurture_leads');
  const canClose = lmsUser?.capabilities?.includes('can_close_leads');

  // --- DEBUGGING: Check the ID from the URL ---
  console.log("1. Reading URL parameters:", { params });
  console.log("2. Extracted lead_id:", lead_id);
  
  // --- RTK Query Hooks for All Data Fetching ---
  const { data: lead, isLoading: leadLoading, error: leadError } = useGetLeadQuery(lead_id, { skip: !lead_id });
  const { data: activities = [], isLoading: activitiesLoading, error: activitiesError } = useGetLeadActivitiesQuery(lead_id, { skip: !lead_id });
  const { data: usersData = [], isLoading: usersLoading, error: usersError } = useGetUsersQuery();
  
  // --- DEBUGGING: Check the state of RTK Query hooks ---
  console.log("3. RTK Query State:", {
    leadHook: { data: lead, isLoading: leadLoading, error: leadError },
    activitiesHook: { data: activities, isLoading: activitiesLoading, error: activitiesError },
    usersHook: { data: usersData, isLoading: usersLoading, error: usersError },
    isSkippingQuery: !lead_id,
  });

  // --- Memoize User Data ---
  const usersMap = useMemo(() => {
    return usersData.reduce((acc: any, user: any) => {
        acc[user.id] = user;
        return acc;
    }, {});
  }, [usersData]);

  // --- Update Page Title ---
  useEffect(() => {
    if (lead?.name) {
      setPageTitle(lead.name);
    }
  }, [lead, setPageTitle]);

  // --- Unified Loading State ---
  if (leadLoading || usersLoading || activitiesLoading) {
    // --- DEBUGGING: Log which block is being rendered ---
    console.log("RENDERING: Loading Skeleton...");
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // --- Unified Error State ---
  const combinedError = leadError || activitiesError || usersError;
  if (combinedError) {
    // --- DEBUGGING: Log which block is being rendered ---
    console.log("RENDERING: Error Message...", { combinedError });
    // Log the detailed error to the browser console for debugging
    console.error("Error fetching lead data:", combinedError);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-destructive">Failed to load page data.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  // --- No Data State ---
  if (!lead) {
    // --- DEBUGGING: Log which block is being rendered ---
    console.log("RENDERING: 'Lead not found' Message because `lead` is:", lead);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <p className="text-lg text-muted-foreground">Lead not found.</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }
  
  // --- DEBUGGING: If we reach here, we are rendering the main content ---
  console.log("RENDERING: Main Lead Profile Content.");

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to All Leads
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground flex items-center gap-3">
            <User className="h-7 w-7 text-primary" /> {lead.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-5 w-5 text-primary" /><span>{lead.email}</span></div>
          {lead.phone && (<div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-5 w-5 text-primary" /><span>{lead.phone}</span></div>)}
          {lead.location && (<div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-5 w-5 text-primary" /><span>{lead.location}</span></div>)}
          <div className="flex items-center gap-2 text-muted-foreground"><Info className="h-5 w-5 text-primary" /><span>Status: {lead.status}</span></div>
          {lead.source && (<div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Source: {lead.source}</span></div>)}
          {lead.createdAt && (<div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-5 w-5 text-primary" /><span>Added: {format(new Date(lead.createdAt), 'MMM d, yyyy')}</span></div>)}
        </CardContent>
      </Card>

      {(canNurture || canClose || isAdmin) && (
        <Card>
          <CardHeader><CardTitle className="text-xl font-semibold text-foreground">Qualification Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Interested Product: {lead.interestedProduct || 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Temperature: {lead.temperature || 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Value: {lead.value || 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Timeline: {lead.timeline || 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Deal Stage: {lead.dealStage || 'N/A'}</span></div>
          </CardContent>
        </Card>
      )}

      {(canClose || isAdmin) && (
        <Card>
          <CardHeader><CardTitle className="text-xl font-semibold text-foreground">Closing Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Fees Paid: {lead.fees_paid || 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Work Duration: {lead.work_duration || 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Product Bought: {lead.product_bought || 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-5 w-5 text-primary" /><span>Closing Date: {lead.closing_date ? format(new Date(lead.closing_date), 'MMM d, yyyy') : 'N/A'}</span></div>
              <div className="flex items-center gap-2 text-muted-foreground md:col-span-2"><Tag className="h-5 w-5 text-primary" /><span>Closing Notes: {lead.closing_notes || 'N/A'}</span></div>
          </CardContent>
        </Card>
      )}
      
      {lead.notes && (
        <Card>
          <CardHeader><CardTitle className="text-xl font-semibold text-foreground">Notes</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-muted-foreground">{lead.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-xl font-semibold text-foreground">Activity</CardTitle></CardHeader>
        <CardContent>
          <Timeline lead_id={lead_id} activities={activities} onAddNote={() => {}} users={usersMap} />
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadProfilePage;