
import React from 'react';
import { Card } from '@/components/ui/card';

export const NurturingKanban = () => {
    // In a real implementation, this would use a library like react-beautiful-dnd
    const stages = ['New (12)', 'Attempt 1 (8)', 'Attempt 2 (5)', 'Qualified (3)'];
    return (
        <Card className="col-span-1 lg:col-span-2">
            <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-zinc-800">My Nurturing Pipeline</h3>
                <p className="text-sm text-zinc-500">Drag and drop leads to update their status.</p>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {stages.map(stage => (
                    <div key={stage} className="bg-slate-100 rounded-lg p-3">
                        <h4 className="font-semibold text-sm mb-3 text-zinc-700">{stage}</h4>
                        <div className="space-y-2">
                            {/* Placeholder Lead Cards */}
                            <div className="bg-white p-3 rounded-md shadow-sm border text-sm">Lead A</div>
                            <div className="bg-white p-3 rounded-md shadow-sm border text-sm">Lead B</div>
                            <div className="bg-white p-3 rounded-md shadow-sm border text-sm">Lead C</div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
