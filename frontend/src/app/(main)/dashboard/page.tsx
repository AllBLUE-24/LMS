"use client";
import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDate } from '@/context/DateContext';
import { motion, Variants } from "framer-motion";
import { format } from "date-fns";
import { useGetDashboardStatsQuery } from '@/store/apiSlice'; // <-- Import the new hook

// --- UI & Chart Component Imports ---
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KpiCard } from '@/components/dashboard/KpiCard';
import { LeadTrendChart } from '@/components/dashboard/LeadTrendChart';
import { LeadsBySourceChart } from '@/components/dashboard/LeadsBySourceChart';
import { RecentLeadsTable } from '@/components/dashboard/RecentLeadsTable';
import { TargetVsActualChart } from '@/components/dashboard/TargetVsActualChart';
import { LeadsByLocationChart } from '@/components/dashboard/LeadsByLocationChart';
import { useVertical } from '@/components/VerticalContextProvider';
import { Users, PieChart, AlertTriangle, TrendingUp, Target, GitBranch, CalendarDays } from 'lucide-react';

// --- TYPE Definitions ---
interface Lead {
    id: string;
    name?: string;
    source?: string;
    createdAt?: any;
    status?: string;
    generatorId?: string;
    location?: string;
}

interface UserStats {
    totalLeadsInPeriod: number;
    leadsToday: number;
    topSource: string;
    leadsTrendData: { day: string; leads: number }[];
    sourceData: { name: string; value: number }[];
    monthlyTargetActual: number;
}

interface TeamStats {
    totalLeadsInPeriod: number;
    topSource: string;
    sourceData: { name: string; value: number }[];
}

interface DashboardStats {
    userStats: UserStats;
    teamStats: TeamStats;
    recentLeads: Lead[]; // This is user-specific
}

const USER_MONTHLY_TARGET = 50;
const TEAM_MONTHLY_TARGET = 200; // This can be dynamic later

// --- Main Dashboard Page ---
export default function DashboardPage() {
    const { lmsUser, loadingAuth } = useAuth();
    const { date } = useDate();

    const { 
        data: stats, 
        error, 
        isLoading 
    } = useGetDashboardStatsQuery({
        // Format the dates to YYYY-MM-DD, or pass undefined if they don't exist.
        from: date?.from ? format(date.from, 'yyyy-MM-dd') : undefined,
        to: date?.to ? format(date.to, 'yyyy-MM-dd') : undefined,
    }, {
        refetchOnMountOrArgChange: true, 
    });

    if (isLoading || loadingAuth) {
        return <DashboardSkeleton />;
    }

    if (error) {
        const errorMessage = (error as any)?.data?.detail || "Could not fetch dashboard statistics.";
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (stats) {
        return <DashboardContent stats={stats} lmsUser={lmsUser} date={date} />;
    }

    // If there's an error and no stats, show the error message.
    // This handles the case where the API returns an error.
    if (error) {
        const errorMessage = (error as any)?.data?.detail || "Could not fetch dashboard statistics.";
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return null; 
}

// --- Sub-Components ---

const DashboardContent = ({ stats, lmsUser, date }: { stats: DashboardStats, lmsUser: any, date: any }) => {
    const { components } = useVertical();
    const VerticalDashboard = components.Dashboard || (() => <></>);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    // Destructure for easier access
    const { userStats, teamStats, recentLeads } = stats;

    return (
        <motion.div
            className="flex-1 space-y-6 p-4 md:p-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <DashboardHeader lmsUser={lmsUser} date={date} />
            <VerticalDashboard />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <motion.div variants={itemVariants}><KpiCard title="Your Leads (Period)" value={userStats.totalLeadsInPeriod.toLocaleString()} icon={<Users size={22} className="text-zinc-500"/>} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard title="Leads Generated Today" value={userStats.leadsToday.toLocaleString()} icon={<TrendingUp size={22} className="text-zinc-500"/>} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard title="Your Top Source" value={userStats.topSource} icon={<PieChart size={22} className="text-zinc-500"/>} /></motion.div>
                <motion.div variants={itemVariants}><KpiCard title="Your Monthly Target" value={`${userStats.monthlyTargetActual}/${USER_MONTHLY_TARGET}`} icon={<Target size={22} className="text-zinc-500"/>} /></motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                    <LeadTrendChart data={userStats.leadsTrendData} />
                </motion.div>
                <motion.div variants={itemVariants}>
                    <LeadsBySourceChart data={userStats.sourceData} />
                </motion.div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <motion.div variants={itemVariants} className="lg:col-span-2">
                    <RecentLeadsTable leads={recentLeads} />
                 </motion.div>
                 <motion.div variants={itemVariants} className="lg:col-span-1">
                    <TargetVsActualChart actual={userStats.monthlyTargetActual} target={USER_MONTHLY_TARGET} title="Your Monthly Progress" />
                 </motion.div>
            </div>

            <div>
                <h3 className="text-2xl font-bold tracking-tight mb-4">Team Performance</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div variants={itemVariants}><KpiCard title="Team Leads (Period)" value={teamStats.totalLeadsInPeriod.toLocaleString()} icon={<Users size={22} className="text-zinc-500"/>} /></motion.div>
                    <motion.div variants={itemVariants}><KpiCard title="Team Top Source" value={teamStats.topSource} icon={<PieChart size={22} className="text-zinc-500"/>} /></motion.div>
                </div>
            </div>
        </motion.div>
    );
};

const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

const DashboardHeader = ({ lmsUser, date }: { lmsUser: any, date: any }) => {
    const dateRangeText = useMemo(() => {
        if (!date || !date.from) return "for all time";
        if (date.from && !date.to) return `for ${format(date.from, 'MMMM d, yyyy')}`;
        return `from ${format(date.from, 'MMMM d')} to ${format(date.to, 'MMMM d, yyyy')}`;
    }, [date]);

    return (
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Welcome back, {lmsUser?.name?.split(' ')[0] || 'User'}!</h2>
                <p className="text-muted-foreground">Here is your performance summary {dateRangeText}.</p>
            </div>
             <div className="flex items-center space-x-2 text-sm text-muted-foreground self-start sm:self-center">
                <CalendarDays className="h-4 w-4" />
                <span>{format(new Date(), "MMMM d, yyyy")}</span>
            </div>
        </motion.div>
    );
};

const DashboardSkeleton = () => (
    <div className="flex-1 space-y-6 p-4 md:p-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-80" />
            </div>
            <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
        
        {/* KPI Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-lg"/>
            <Skeleton className="h-28 rounded-lg"/>
            <Skeleton className="h-28 rounded-lg"/>
            <Skeleton className="h-28 rounded-lg"/>
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
        </div>

        {/* Table and Chart Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 rounded-lg lg:col-span-2" />
            <Skeleton className="h-96 rounded-lg" />
        </div>
    </div>
);