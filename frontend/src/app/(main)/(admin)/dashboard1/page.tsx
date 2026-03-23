"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Target, CheckCircle, Percent, Crown, Zap } from 'lucide-react';
import { useGetAdminDashboardStatsQuery } from '@/store/apiSlice'; // <-- Import the new hook

// --- Type Definitions ---
type KpiData = {
    totalLeads: number;
    conversionRate: number;
};

type PipelineData = {
    [key: string]: number;
};

type LeaderboardEntry = {
    name: string;
    count: number;
};

type DashboardData = {
    kpis: KpiData;
    pipeline: PipelineData;
    leaderboards: {
        topGenerators: LeaderboardEntry[];
        topClosers: LeaderboardEntry[];
    };
};

// --- Reusable Components (No changes) ---

const KpiCard = ({ title, value, icon: Icon, unit = '' }: { title: string, value: string | number, icon: React.ElementType, unit?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}{unit}</div>
        </CardContent>
    </Card>
);

const Leaderboard = ({ title, data, icon: Icon }: { title: string, data: LeaderboardEntry[], icon: React.ElementType }) => (
    <Card className="h-full">
        <CardHeader className="flex flex-row items-center space-x-3 space-y-0">
            <Icon className="h-6 w-6 text-primary" />
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-4">
                {data.length > 0 ? data.map((entry, index) => (
                    <li key={index} className="flex items-center justify-between">
                        <span className="font-medium text-sm">{index + 1}. {entry.name}</span>
                        <span className="font-bold text-lg">{entry.count}</span>
                    </li>
                )) : <p className="text-sm text-muted-foreground">No data available.</p>}
            </ul>
        </CardContent>
    </Card>
);


// --- Main Admin Dashboard Page ---

export default function AdminDashboardPage() {
    // --- RTK Query Hook for Data Fetching ---
    const { data, error, isLoading } = useGetAdminDashboardStatsQuery();

    const pipelineChartData = data ? Object.entries(data.pipeline).map(([name, value]) => ({ name, count: value })) : [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                     <Skeleton className="lg:col-span-2 h-96" />
                     <Skeleton className="h-96" />
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4 bg-red-50 rounded-lg"><strong>Error:</strong> {(error as any)?.data?.detail || 'Failed to fetch dashboard data'}</div>;
    }

    if (!data) {
        return <div>No data available.</div>;
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">A high-level overview of your team&apos;s performance and lead pipeline.</p>
            </header>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total Leads" value={data.kpis.totalLeads} icon={Users} />
                <KpiCard title="Conversion Rate" value={data.kpis.conversionRate} icon={Percent} unit="%" />
                <KpiCard title="Leads Won" value={data.pipeline['Closed - Won'] || 0} icon={CheckCircle} />
                <KpiCard title="Active Leads" value={data.pipeline['Contacted'] || 0} icon={Target} />
            </div>

            {/* Main Grid for Charts and Leaderboards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lead Pipeline Chart */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Lead Pipeline Status</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-15} textAnchor="end" height={50} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Team Performance Section */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">Team Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Leaderboard title="Top Lead Generators" data={data.leaderboards.topGenerators} icon={Zap} />
                    <Leaderboard title="Top Closing Agents (by Wins)" data={data.leaderboards.topClosers} icon={Crown} />
                </div>
            </div>
        </div>
    );
}