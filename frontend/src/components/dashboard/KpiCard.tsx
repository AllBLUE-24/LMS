
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type KpiCardProps = {
    title: string;
    value: string;
    icon: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative';
};

export const KpiCard = ({ title, value, icon, change, changeType }: KpiCardProps) => {
    return (
        <Card className="p-5">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
                </div>
                <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-full">
                    {icon}
                </div>
            </div>
            {change && (
                <p className={cn(
                    'mt-2 text-xs',
                    changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )}>
                    <span className="font-semibold">{change}</span> vs last period
                </p>
            )}
        </Card>
    );
};
