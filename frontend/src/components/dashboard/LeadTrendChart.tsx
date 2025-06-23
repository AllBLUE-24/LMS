import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

export const LeadTrendChart = ({ data }) => {
    return (
        <Card>
            <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-zinc-800">Lead Generation Trend</h3>
                <p className="text-sm text-zinc-500">Number of leads generated over the last 7 days.</p>
            </div>
            <div className="w-full h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend iconType="plainline" />
                        <Area type="monotone" dataKey="leads" stroke="#0088FE" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}