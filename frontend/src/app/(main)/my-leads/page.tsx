"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/app/(main)/leads/data-table';
import { GeneratedLead, columns } from './columns';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetGeneratedLeadsQuery, useGetNurturersQuery, useBulkAssignLeadsMutation } from '@/store/apiSlice';
import { RowSelectionState, ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

// --- Main Page Component ---
export default function MyLeadsPage() {
    const { lmsUser, loadingAuth } = useAuth();
    const router = useRouter();
    const [view, setView] = useState<'assign' | 'my' | 'all'>('assign');
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [selectedNurturer, setSelectedNurturer] = useState<string | null>(null);

    // --- RTK Query Hooks ---
    const { data, error, isLoading } = useGetGeneratedLeadsQuery();
    const { data: nurturers = [], isLoading: isLoadingNurturers } = useGetNurturersQuery();
    const [bulkAssignLeads, { isLoading: isAssigning }] = useBulkAssignLeadsMutation();

    const isHead = lmsUser?.capabilities.includes('head_of_generators');

    const assignableLeads = useMemo(() => {
        if (!data || !data.leads) return [];
        return data.leads.filter((lead: GeneratedLead) => lead.status === 'New');
    }, [data]);

    const myGeneratedLeads = useMemo(() => {
        if (!data || !data.leads) return [];
        return data.leads.filter((lead: GeneratedLead) => lead.generatorId === lmsUser?.id);
    }, [data, lmsUser]);

    const allGeneratedLeads = useMemo(() => data?.leads || [], [data]);

    const selectedLeadIds = useMemo(() => {
        return Object.keys(rowSelection)
            .map(index => assignableLeads[parseInt(index, 10)]?.id)
            .filter(Boolean);
    }, [rowSelection, assignableLeads]);

    const handleBulkAssign = async () => {
        if (!selectedNurturer || selectedLeadIds.length === 0) {
            alert("Please select a nurturer and at least one lead.");
            return;
        }
        try {
            await bulkAssignLeads({ leadIds: selectedLeadIds, agentId: selectedNurturer }).unwrap();
            setRowSelection({});
        } catch (err) {
            console.error("Assignment failed:", err);
        }
    };
    
    const viewColumns: ColumnDef<GeneratedLead>[] = useMemo(() => 
        columns.filter(c => c.id !== 'select'), 
    []);

    const getViewData = () => {
        if (isHead) {
            switch (view) {
                case 'assign': return assignableLeads;
                case 'my': return myGeneratedLeads;
                case 'all': return allGeneratedLeads;
                default: return [];
            }
        }
        // Regular generator view
        switch (view) {
            case 'assign': return assignableLeads;
            case 'my': 
            default:
                return myGeneratedLeads;
        }
    };

    const HeaderButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
        <Button variant={active ? 'default' : 'outline'} onClick={onClick}>
            {children}
        </Button>
    );

    return (
        <div>
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Generated Leads</h1>
                        <p className="text-muted-foreground mt-2">
                            {view === 'assign' ? 'Assign new leads to a nurturer.' : 'View generated leads.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <HeaderButton active={view === 'assign'} onClick={() => setView('assign')}>Assign Leads</HeaderButton>
                        {isHead ? (
                            <>
                                <HeaderButton active={view === 'my'} onClick={() => setView('my')}>My Leads</HeaderButton>
                                <HeaderButton active={view === 'all'} onClick={() => setView('all')}>All Leads</HeaderButton>
                            </>
                        ) : (
                            <HeaderButton active={view === 'my'} onClick={() => setView('my')}>My Leads</HeaderButton>
                        )}
                    </div>
                </div>
                {(view === 'assign' || (isHead && view === 'all')) && (
                    <div className="flex items-center gap-4 mt-6">
                        <Select onValueChange={setSelectedNurturer} disabled={isLoadingNurturers || selectedLeadIds.length === 0}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select Nurturer" />
                            </SelectTrigger>
                            <SelectContent>
                                {nurturers.map((nurturer: any) => (
                                    <SelectItem key={nurturer.id} value={nurturer.id}>{nurturer.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleBulkAssign} disabled={isAssigning || !selectedNurturer || selectedLeadIds.length === 0}>
                            {isAssigning ? 'Assigning...' : `Assign ${selectedLeadIds.length} Leads`}
                        </Button>
                    </div>
                )}
            </header>

            {error && <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6"><p className="font-bold">Could not load leads:</p><p>{(error as any)?.data?.detail || 'An unknown error occurred'}</p></div>}
            
            {isLoading || loadingAuth ? (
                <div className="space-y-4"><Skeleton className="h-64 w-full" /></div>
            ) : (
                <DataTable 
                    columns={(view === 'assign' || (isHead && view === 'all')) ? columns : viewColumns} 
                    data={getViewData()} 
                    filterColumn="name"
                    rowSelection={(view === 'assign' || (isHead && view === 'all')) ? rowSelection : {}}
                    setRowSelection={(view === 'assign' || (isHead && view === 'all')) ? setRowSelection : undefined}
                    onRowClick={(row) => router.push(`/leads/${row.original.id}`)}
                />
            )}
        </div>
    );
}