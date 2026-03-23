import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartLegendContent, ChartConfig } from '@/components/ui/chart';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const chartConfig = {
    leads: {
        label: "Leads",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

export const LeadsBySourceChart = ({ data }) => {
    // Transform the data from a map {name: value} to an array [{name, value}]
    const chartData = data || [];

    return (
        <Card>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground">Leads by Source</h3>
                <p className="text-sm text-muted-foreground">Where your new leads are coming from.</p>
            </div>
            <div className="w-full h-72 p-4">
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="hsl(var(--primary))"
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} />
                    </PieChart>
                </ChartContainer>
            </div>
        </Card>
    );
};
