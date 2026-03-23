"use client";

import React, { useState, useMemo } from 'react';
import { DataTable } from '@/app/(main)/leads/data-table';
import { columns } from './columns';
import { useAuth } from '@/context/AuthContext'; 
import { Skeleton } from '@/components/ui/skeleton';
import { useGetMyEnquiriesQuery } from '@/store/apiSlice';
import { InteractionModal } from '@/components/leads/InteractionModal';
import { AssignedLead } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { CheckCircle, TrendingUp, XCircle, Briefcase } from 'lucide-react';

type View = 'new' | 'ncd' | 'meet' | 'won';

// --- Helper Components ---
const AgentStatsDashboard = ({ leads }: { leads: AssignedLead[] }) => {
    const stats = useMemo(() => {
        const total = leads.length;
        const won = leads.filter(l => l.status === 'Closed - Won').length;
        const lost = leads.filter(l => l.status === 'Closed - Lost').length;
        const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;
        return { total, won, lost, conversionRate };
    }, [leads]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Enquiries</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Leads Won</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.won}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Leads Lost</CardTitle><XCircle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.lost}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Conversion Rate</CardTitle><TrendingUp className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.conversionRate}%</div></CardContent></Card>
        </div>
    );
};

// --- Main Page Component ---
export default function MyEnquiriesPage() {
    const { lmsUser, loadingAuth } = useAuth();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<AssignedLead | null>(null);
    const [view, setView] = useState<View>('new');
    const [scope, setScope] = useState<'my' | 'all'>('my');

    const { data, error, isLoading } = useGetMyEnquiriesQuery();
    const allLeads = useMemo(() => data?.leads || [], [data]);

    const isHead = lmsUser?.capabilities.includes('head_of_closers');

    const handleOpenModal = (lead: AssignedLead) => {
        setSelectedLead(lead);
        setModalOpen(true);
    };

    const tableColumns = useMemo(() => columns(handleOpenModal), []);

    const leadsToDisplay = useMemo(() => {
        if (isHead && scope === 'all') {
            return allLeads;
        }
        return allLeads.filter((l: AssignedLead) => l.assignedAgent === lmsUser?.id);
    }, [allLeads, isHead, scope, lmsUser]);

    const { newLeads, upcomingNCDs, upcomingMeetings, closedWonLeads } = useMemo(() => {
        const now = new Date();
        const newL = leadsToDisplay.filter((l: AssignedLead) => l.status === 'Ready for Closing');
        const ncds = leadsToDisplay.filter((l: AssignedLead) => l.next_call_date && new Date(l.next_call_date) >= now)
            .sort((a, b) => new Date(a.next_call_date).getTime() - new Date(b.next_call_date).getTime());
        const meetings = leadsToDisplay.filter((l: AssignedLead) => l.next_meet_date && new Date(l.next_meet_date) >= now)
            .sort((a, b) => new Date(a.next_meet_date).getTime() - new Date(b.next_meet_date).getTime());
        const won = leadsToDisplay.filter((l: AssignedLead) => l.status === 'Closed - Won');
        return { newLeads: newL, upcomingNCDs: ncds, upcomingMeetings: meetings, closedWonLeads: won };
    }, [leadsToDisplay]);

    const getViewData = () => {
        if (isHead) {
            switch (view) {
                case 'new': return newLeads;
                case 'ncd': return upcomingNCDs;
                case 'meet': return upcomingMeetings;
                case 'won': return closedWonLeads;
                default: return [];
            }
        }
        // Regular closer view
        switch (view) {
            case 'new': return newLeads;
            case 'ncd': return upcomingNCDs;
            case 'meet': return upcomingMeetings;
            case 'won': return closedWonLeads;
            default: return newLeads;
        }
    };

    return (
        <>
            <div className="p-4 md:p-8 space-y-8">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">My Enquiries</h1>
                    <p className="text-muted-foreground mt-2">Your personal pipeline of assigned leads.</p>
                </header>

                {isLoading || loadingAuth ? (
                    <Skeleton className="h-24 w-full" />
                ) : (
                    <AgentStatsDashboard leads={leadsToDisplay} />
                )}

                <div className="flex justify-between items-center border-b pb-2">
                    <div className="flex space-x-2">
                        <Button variant={view === 'new' ? 'secondary' : 'ghost'} onClick={() => setView('new')}>Newly Assigned ({newLeads.length})</Button>
                        <Button variant={view === 'ncd' ? 'secondary' : 'ghost'} onClick={() => setView('ncd')}>Upcoming NCD ({upcomingNCDs.length})</Button>
                        <Button variant={view === 'meet' ? 'secondary' : 'ghost'} onClick={() => setView('meet')}>Upcoming Meet ({upcomingMeetings.length})</Button>
                        <Button variant={view === 'won' ? 'secondary' : 'ghost'} onClick={() => setView('won')}>Closed-Won ({closedWonLeads.length})</Button>
                    </div>
                    {isHead && (
                        <div className="flex space-x-2">
                            <Button variant={scope === 'my' ? 'secondary' : 'ghost'} onClick={() => setScope('my')}>My Leads</Button>
                            <Button variant={scope === 'all' ? 'secondary' : 'ghost'} onClick={() => setScope('all')}>All Leads</Button>
                        </div>
                    )}
                </div>

                {error && <div className="bg-destructive/10 text-destructive p-4 rounded-md my-6"><p className="font-bold">Could not load leads</p></div>}
                
                {isLoading || loadingAuth ? (
                    <Skeleton className="h-64 w-full" />
                ) : (
                    <DataTable columns={tableColumns} data={getViewData()} filterColumn="name" />
                )}
            </div>
            <InteractionModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                lead={selectedLead}
            />
        </>
    );
}
