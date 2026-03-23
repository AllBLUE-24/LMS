import React from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const TargetVsActualChart = ({ actual, target, title }: { actual: number, target: number, title: string }) => {
    const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
    const data = [{ name: 'Leads', value: percentage }];

    return (
        <Card className="h-full shadow-md">
            <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-0 pb-4 -mt-4">
                <div className="w-full h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="70%"
                            outerRadius="85%"
                            barSize={12}
                            data={data}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar
                                background
                                clockWise
                                dataKey="value"
                                cornerRadius={10}
                                fill="hsl(var(--primary))"
                            />
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="hsl(var(--foreground))"
                            >
                                {percentage}%
                            </text>
                             <text
                                x="50%"
                                y="68%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="text-sm fill-muted-foreground"
                            >
                                {actual.toLocaleString()} / {target.toLocaleString()}
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

