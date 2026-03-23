import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

const chartConfig = {
    leads: {
        label: "Leads",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

export const LeadsByLocationChart = ({ data }) => {
    // Check if data is empty or null
    if (!data || data.length === 0) {
        return (
            <Card>
                <div className="p-4">
                    <h3 className="text-lg font-semibold text-foreground">Leads by Location</h3>
                    <p className="text-sm text-muted-foreground">Performance across different branches or cities.</p>
                </div>
                <div className="w-full h-72 p-4 flex items-center justify-center text-muted-foreground">
                    No lead location data available for this period.
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground">Leads by Location</h3>
                <p className="text-sm text-muted-foreground">Performance across different branches or cities.</p>
            </div>
            <div className="w-full h-72 p-4">
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="leads" fill="hsl(var(--primary))" barSize={30} />
                    </BarChart>
                </ChartContainer>
            </div>
        </Card>
    );
};
