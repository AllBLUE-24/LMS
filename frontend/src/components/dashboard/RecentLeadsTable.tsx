import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timestamp } from 'firebase/firestore';

// --- TYPE Definitions (copied from page.tsx for clarity)---
interface Lead {
    id: string;
    name?: string;
    source?: string;
    createdAt?: Timestamp; // Timestamp or Date, depending on how it's passed
    status?: string;
    generatorId?: string;
    location?: string;
}

export const RecentLeadsTable = ({ leads }: { leads: Lead[] }) => { // Accept leads as a prop
    return (
        <Card>
             <div className="p-4 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Recently Generated Leads</h3>
                    <p className="text-sm text-muted-foreground">The latest leads you have generated.</p>
                </div>
                <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length > 0 ? (
                            leads.map(lead => (
                                <tr key={lead.id} className="bg-background hover:bg-muted">
                                    <td className="px-6 py-4 font-medium text-foreground">{lead.name || 'N/A'}</td>
                                    <td className="px-6 py-4">{lead.source || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">{lead.status || 'N/A'}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-zinc-500">No recent leads found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
