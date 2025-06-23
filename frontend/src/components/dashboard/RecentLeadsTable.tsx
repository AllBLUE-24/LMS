import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock data, to be replaced by API call
const mockLeads = [
    { id: 'L001', name: 'Alice Johnson', source: 'Website', status: 'New' },
    { id: 'L002', name: 'Bob Williams', source: 'Referral', status: 'Assigned' },
    { id: 'L003', name: 'Charlie Brown', source: 'Event', status: 'New' },
    { id: 'L004', name: 'Diana Miller', source: 'Website', status: 'New' },
];

export const RecentLeadsTable = () => {
    return (
        <Card>
             <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-800">Recently Generated Leads</h3>
                    <p className="text-sm text-zinc-500">The latest leads you have generated.</p>
                </div>
                <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Source</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockLeads.map(lead => (
                            <tr key={lead.id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-zinc-900">{lead.name}</td>
                                <td className="px-6 py-4">{lead.source}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">{lead.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
