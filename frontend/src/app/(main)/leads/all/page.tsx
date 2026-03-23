"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ListX, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

// Define a type for our lead data for better code quality
interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  source: string;
  createdAt?: { seconds: number };
}

// This is the main component for the All Leads list page
export default function AllLeadsPage() {
  const { db, lmsUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !lmsUser?.tenantId) return;
    
    const tenantId = lmsUser.tenantId;
    const leadsQuery = query(
      collection(db, `tenants/${tenantId}/leads`), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching leads:", err);
      setError("Failed to load leads. Please try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, lmsUser]);

  // A more detailed skeleton loader that matches the table layout
  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">All Leads</h1>
          <p className="text-muted-foreground mt-1">A comprehensive list of all leads in the system.</p>
        </header>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead><Skeleton className="h-5 w-32" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  if (error) {
    return <div className="text-center text-destructive p-8">{error}</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">All Leads</h1>
        <p className="text-muted-foreground mt-1">A comprehensive list of all leads in the system.</p>
      </header>
      
      <div className="rounded-lg border bg-card text-card-foreground">
        {leads.length === 0 ? (
          <div className="text-center py-16">
            <ListX size={48} className="mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No leads found in the system.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Lead Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead><span className="sr-only">View</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} className="group">
                  <TableCell className="font-medium">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      <div className="font-semibold text-primary-foreground">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">{lead.email}</div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{lead.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-foreground">{lead.source || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    {lead.createdAt ? (
                      <div className="text-muted-foreground" title={format(new Date(lead.createdAt.seconds * 1000), 'PPPpp')}>
                        {formatDistanceToNow(new Date(lead.createdAt.seconds * 1000), { addSuffix: true })}
                      </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                     <Link href={`/leads/${lead.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                     </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}