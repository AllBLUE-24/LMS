import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent, ChartConfig } from '@/components/ui/chart';

const chartConfig = {
    leads: {
        label: "Leads",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

export const LeadTrendChart = ({ data }) => {
    return (
        <Card>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground">Lead Generation Trend</h3>
                <p className="text-sm text-muted-foreground">Number of leads generated over the last 7 days.</p>
            </div>
            <div className="w-full h-72 p-4">
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} iconType="plainline" />
                        <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                    </AreaChart>
                </ChartContainer>
            </div>
        </Card>
    )
}