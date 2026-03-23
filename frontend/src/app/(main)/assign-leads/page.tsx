"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { DataTable } from '../leads/data-table';
import { columns, Lead } from '../leads/columns';
import { Skeleton } from '@/components/ui/skeleton';
// --- STEP 1: Import the correct RTK Query hook ---
import { useGetUsersByCapabilityQuery , useGetClosersQuery } from '@/store/apiSlice';
import { User } from '@/types';

// Main Page Component for Lead Generators
export default function AssignLeadsPage() {
    const { db, lmsUser } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoadingLeads, setIsLoadingLeads] = useState(true);

    // --- STEP 2: Fetch NURTURERS, not all users or closers ---
    // This hook fetches only users with the 'can_nurture_leads' capability.
    const { 
        data: nurturers = [], 
        isLoading: isLoadingNurturers, 
        error: usersError 
    } = useGetUsersByCapabilityQuery('can_nurture_leads');

    // Fetch all unassigned ("New") leads in real-time
    useEffect(() => {
        if (!db || !lmsUser?.tenantId) {
            setIsLoadingLeads(false);
            return;
        }
        const tenantId = lmsUser.tenantId;
        const q = query(
            collection(db, `tenants/${tenantId}/leads`), 
            where("status", "in", ["new", "New"]),
            where("assignedNurturer", "==", null) // Only show leads not yet assigned to a nurturer
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    email: data.email,
                    status: data.status,
                    source: data.source,
                    performanceMetric: data.performanceMetric,
                    assignedAgent: data.assignedAgent // Keep existing fields
                } as Lead;
            });
            setLeads(leadsData);
            setIsLoadingLeads(false);
        }, (err) => { 
            console.error("Leads fetch error.", err); 
            setIsLoadingLeads(false); 
        });
        
        return () => unsubscribe();
    }, [db, lmsUser]);

    const TableSkeleton = () => (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );

    const isLoading = isLoadingLeads || isLoadingNurturers;

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Assign New Leads</h1>
                <p className="text-muted-foreground mt-1">Select new leads and assign them to a Nurturer to begin the process.</p>
            </header>
            
            {usersError && <div className="text-red-500">Failed to load nurturers. Please try again.</div>}

            {isLoading ? (
                <TableSkeleton />
            ) : (
                // --- STEP 3: Pass the 'nurturers' list to the DataTable ---
                // Your DataTable component will now receive the list of available nurturers.
                // Inside the DataTable, your assignment modal should use this list and call the 
                // 'useBulkAssignLeadsMutation' hook on submit.
                <DataTable columns={columns} data={leads} filterColumn="name" users={nurturers} />
            )}
        </div>
    );
}