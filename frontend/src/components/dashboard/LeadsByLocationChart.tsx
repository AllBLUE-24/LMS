import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

export const LeadsByLocationChart = ({ data }) => {
    return (
        <Card>
            <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-zinc-800">Leads by Location</h3>
                <p className="text-sm text-zinc-500">Performance across different branches or cities.</p>
            </div>
            <div className="w-full h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="leads" fill="#8884d8" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
