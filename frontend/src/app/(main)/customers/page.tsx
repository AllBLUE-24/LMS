"use client";

import React from 'react';
import { DataTable } from '@/app/(main)/leads/data-table';
import { columns } from './columns';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetClosedWonLeadsQuery } from '@/store/apiSlice';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

const CustomersPage = () => {
    const { data: customers, error, isLoading } = useGetClosedWonLeadsQuery();

    if (isLoading) {
        return <CustomersPageSkeleton />;
    }

    if (error) {
        const errorMessage = (error as any)?.data?.detail || "Could not fetch customers.";
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
        <div className="p-4 md:p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                <p className="text-muted-foreground">A list of all your closed-won leads.</p>
            </header>
            <DataTable
                columns={columns}
                data={customers || []}
                filterColumn="name"
            />
        </div>
    );
};

const CustomersPageSkeleton = () => (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
        <header>
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-5 w-1/2" />
        </header>
        <Skeleton className="h-64 w-full" />
    </div>
);

export default CustomersPage;
