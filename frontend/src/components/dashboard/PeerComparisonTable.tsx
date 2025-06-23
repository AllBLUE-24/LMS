import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Peer { name: string; leads: number; }

export const PeerComparisonTable = ({ data, currentUser }: { data: Peer[], currentUser: string }) => {
    return (
        <Card className="glass-card h-full">
            <CardHeader>
                <CardTitle>Peer Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((peer, index) => (
                        <div key={peer.name} className="flex items-center">
                            <span className={cn("text-sm font-bold w-6", index < 3 ? "text-primary" : "text-zinc-500")}>#{index + 1}</span>
                            <div className={cn("flex-1 p-3 rounded-md", peer.name === currentUser ? 'bg-primary/10 border-l-4 border-primary' : 'bg-slate-50')}>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-zinc-800">{peer.name} {peer.name === currentUser && '(You)'}</span>
                                    <span className="font-bold text-primary">{peer.leads.toLocaleString()} leads</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
