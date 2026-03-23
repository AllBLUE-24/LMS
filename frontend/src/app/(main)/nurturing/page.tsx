"use client";

import React, { useState, useMemo } from 'react';
import { useGetNurturingQueueQuery } from '@/store/apiSlice';
import { Lead } from '@/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { InteractionModal } from '@/components/leads/InteractionModal';
import { DataTable } from '@/app/(main)/leads/data-table';
import { columns } from './columns';

import { useAuth } from '@/context/AuthContext';

type View = 'my-leads' | 'all-leads' | 'contacted' | 'upcoming' | 'missed' | 'interested';

// --- Main Nurturing Page Component ---
export default function NurturingPage() {
    const { lmsUser } = useAuth();
    const { data: queue, error, isLoading } = useGetNurturingQueueQuery();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [view, setView] = useState<View>('my-leads');

    const handleOpenModal = (lead: Lead) => {
        setSelectedLead(lead);
        setModalOpen(true);
    };

    const tableColumns = useMemo(() => columns(handleOpenModal), []);

    const isHead = lmsUser?.capabilities.includes('head_of_nurturers');

    const { myLeads, allLeads, contactedLeads, upcomingCalls, missedCalls, interestedLeads } = useMemo(() => {
        const now = new Date();
        const my = queue?.filter((l: Lead) => l.assignedNurturer === lmsUser?.id) || [];
        const all = queue || [];
        const contacted = queue?.filter((l: Lead) => ["Contacted", "Follow-up", "Not Interested"].includes(l.status)) || [];
        const upcoming = queue?.filter((l: Lead) => l.next_call_date && new Date(l.next_call_date) >= now)
            .sort((a, b) => new Date(a.next_call_date).getTime() - new Date(b.next_call_date).getTime()) || [];
        const missed = queue?.filter((l: Lead) => l.next_call_date && new Date(l.next_call_date) < now)
            .sort((a, b) => new Date(a.next_call_date).getTime() - new Date(b.next_call_date).getTime()) || [];
        const interested = queue?.filter((l: Lead) => l.status === 'Interested') || [];
        return { myLeads: my, allLeads: all, contactedLeads: contacted, upcomingCalls: upcoming, missedCalls: missed, interestedLeads: interested };
    }, [queue, lmsUser]);

    const getViewData = () => {
        if (isHead) {
            switch (view) {
                case 'my-leads': return myLeads;
                case 'all-leads': return allLeads;
                case 'contacted': return contactedLeads;
                case 'upcoming': return upcomingCalls;
                case 'missed': return missedCalls;
                case 'interested': return interestedLeads;
                default: return [];
            }
        }
        // Regular nurturer view
        switch (view) {
            case 'my-leads': return myLeads;
            case 'contacted': return contactedLeads;
            case 'upcoming': return upcomingCalls;
            case 'missed': return missedCalls;
            case 'interested': return interestedLeads;
            default: return myLeads;
        }
    };

    if (isLoading) {
        return <NurturingPageSkeleton />;
    }

    if (error) {
        const errorMessage = (error as any)?.data?.detail || "Could not fetch nurturing queue.";
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 md:p-8 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">Nurturing Queue</h1>
                    <p className="text-muted-foreground">Your prioritized list of leads to follow up with.</p>
                    <div className="flex space-x-2 mt-4 border-b pb-2">
                        {isHead ? (
                            <>
                                <Button variant={view === 'my-leads' ? 'secondary' : 'ghost'} onClick={() => setView('my-leads')}>My Leads ({myLeads.length})</Button>
                                <Button variant={view === 'all-leads' ? 'secondary' : 'ghost'} onClick={() => setView('all-leads')}>All Leads ({allLeads.length})</Button>
                            </>
                        ) : (
                            <Button variant={view === 'my-leads' ? 'secondary' : 'ghost'} onClick={() => setView('my-leads')}>My Leads ({myLeads.length})</Button>
                        )}
                        <Button variant={view === 'contacted' ? 'secondary' : 'ghost'} onClick={() => setView('contacted')}>Contacted ({contactedLeads.length})</Button>
                        <Button variant={view === 'upcoming' ? 'secondary' : 'ghost'} onClick={() => setView('upcoming')}>Upcoming NCD ({upcomingCalls.length})</Button>
                        <Button variant={view === 'missed' ? 'secondary' : 'ghost'} onClick={() => setView('missed')}>Missed NCD ({missedCalls.length})</Button>
                        <Button variant={view === 'interested' ? 'secondary' : 'ghost'} onClick={() => setView('interested')}>Interested ({interestedLeads.length})</Button>
                    </div>
                </header>
                
                <DataTable
                    columns={tableColumns}
                    data={getViewData()}
                    filterColumn="name"
                />
            </div>

            <InteractionModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                lead={selectedLead}
            />
        </>
    );
}

const NurturingPageSkeleton = () => (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
        <header>
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex space-x-2 mt-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>
        </header>
        <Skeleton className="h-64 w-full" />
    </div>
);