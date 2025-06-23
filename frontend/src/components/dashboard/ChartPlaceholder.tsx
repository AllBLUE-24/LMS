
import React from 'react';
import { Card } from '@/components/ui/card';

type ChartPlaceholderProps = {
    title: string;
    subtitle: string;
}

export const ChartPlaceholder = ({ title, subtitle }: ChartPlaceholderProps) => {
    return (
        <Card>
            <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-zinc-800">{title}</h3>
                <p className="text-sm text-zinc-500">{subtitle}</p>
            </div>
            <div className="p-4">
                <div className="w-full h-56 bg-slate-100 rounded-md flex items-center justify-center">
                    <p className="text-zinc-500 text-sm">Chart visualization will be here</p>
                </div>
            </div>
        </Card>
    )
}