"use client"; // This is the most important change: it makes this a Client Component.

import React, { useState, useEffect } from 'react';
import { Lead, columns } from "../columns";
import { DataTable } from "../data-table";
import { Skeleton } from "@/components/ui/skeleton"; // A new UI component for loading states

// A new component to show a loading skeleton for the table
const DataTableSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-md border">
        <div className="space-y-2 p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  )
}

export default function LeadsPage() {
  const [data, setData] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect runs in the browser after the component has loaded.
  // This is the correct place to fetch client-side data.
  useEffect(() => {
    async function getLeads() {
      try {
        const res = await fetch('http://localhost:8000/api/v1/leads');

        if (!res.ok) {
          throw new Error('Failed to fetch leads from the API. Please ensure the backend is running.');
        }

        const leadsData = await res.json();
        setData(leadsData);

      } catch (err: any) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    getLeads();
  }, []); // The empty array [] ensures this effect runs only once.

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">All Leads</h1>
          <p className="text-zinc-500 mt-2">
            A comprehensive list of all leads in the system, fetched live from the database.
          </p>
      </header>

      {isLoading && <DataTableSkeleton />}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-center">
            <h3 className="font-semibold">Could not load leads</h3>
            <p className="text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  )
}
