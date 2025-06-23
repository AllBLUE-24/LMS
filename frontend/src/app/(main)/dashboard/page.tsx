// FILE: src/app/(main)/dashboard/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, Variants } from "framer-motion"; // Import Variants type
import { useDate } from '@/context/DateContext';
import { cn } from '@/lib/utils';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Icons & Charting Library
import { Users, BarChart2, PieChart as PieChartIcon, Target, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, XAxis, YAxis, Bar, AreaChart, Area, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { format } from "date-fns";

// --- TYPE Definitions ---
interface Lead { id: string; name?: string; source?: string; location?: string; createdAt: Timestamp; status?: string; }
interface CalculatedStats {
    totalLeads: number;
    topSource: string;
    sourceData: { name: string; value: number; fill: string; }[];
    locationData: { name: string; leads: number; }[];
    trendData: { day: string; leads: number }[];
    targetData: { actual: number; target: number };
    peerData: { name: string; leads: number }[];
}

// --- CHILD COMPONENTS ---
const AnimatedCounter = ({ value }: { value: number }) => (<span>{value.toLocaleString()}</span>);
const KpiCard = ({ title, value, valueString, icon }: { title: string; value?: number; valueString?: string; icon: React.ReactNode; }) => ( <Card className="glass-card h-full flex flex-col justify-center"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><div className="text-muted-foreground">{icon}</div></CardHeader><CardContent><div className="text-2xl md:text-3xl font-bold">{value !== undefined ? <AnimatedCounter value={value} /> : valueString}</div></CardContent></Card> );
const TargetVsActualChart = ({ actual, target }: { actual: number; target: number }) => { const p = target > 0 ? Math.round((actual / target) * 100) : 0; const d = [{ name: 'Leads', value: p }]; return (<Card className="glass-card h-full"><CardHeader><CardTitle className="text-base font-medium">Monthly Target Progress</CardTitle></CardHeader><CardContent className="flex items-center justify-center p-0 h-[calc(100%-3.5rem)]"><ResponsiveContainer width="100%" height="100%"><RadialBarChart innerRadius="70%" outerRadius="85%" barSize={12} data={d} startAngle={90} endAngle={-270}><PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} /><RadialBar background dataKey="value" cornerRadius={50} fill="hsl(var(--primary))" /><text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold fill-foreground">{p}%</text><text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-muted-foreground">{actual.toLocaleString()}/{target.toLocaleString()}</text></RadialBarChart></ResponsiveContainer></CardContent></Card>);};
const PeerComparisonTable = ({ data, currentUser }: { data: { name: string; leads: number }[], currentUser: string }) => ( <Card className="glass-card h-full"><CardHeader><CardTitle>Peer Leaderboard</CardTitle></CardHeader><CardContent><div className="space-y-4">{data.map((peer, i) => (<div key={peer.name} className="flex items-center"><span className={cn("text-sm font-bold w-6", i<3?"text-primary":"text-zinc-500")}>#{i+1}</span><div className={cn("flex-1 p-3 rounded-md",peer.name===currentUser?'bg-primary/10 border-l-4 border-primary':'bg-slate-100 dark:bg-zinc-800')}><div className="flex justify-between items-center"><span className="font-semibold text-zinc-800">{peer.name}{peer.name===currentUser&&' (You)'}</span><span className="font-bold text-primary">{peer.leads.toLocaleString()}</span></div></div></div>))}</div></CardContent></Card> );
const LeadsBySourceChart = ({ data }: { data: { name: string, value: number, fill: string }[] }) => ( <Card className="glass-card h-full"><CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader><CardContent className="h-[calc(100%-4rem)]"><ResponsiveContainer width="100%" height="100%"><PieChart><Tooltip contentStyle={{background:'rgba(255,255,255,0.8)',backdropFilter:'blur(5px)'}} /><Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" >{data.map((e) => (<Cell key={`cell-${e.name}`} fill={e.fill} stroke={e.fill} />))}</Pie></PieChart></ResponsiveContainer></CardContent></Card> );
const LeadsByLocationChart = ({ data }: { data: { name: string, leads: number }[] }) => ( <Card className="glass-card h-full"><CardHeader><CardTitle>Leads by Location</CardTitle></CardHeader><CardContent className="h-[calc(100%-4rem)] pl-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{left:10, right:30}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} style={{fontSize:'12px'}}/><Tooltip cursor={{fill:'rgba(200,200,200,0.2)'}} contentStyle={{background:'rgba(255,255,255,0.8)',backdropFilter:'blur(5px)'}}/><Bar dataKey="leads" fill="hsl(var(--primary))" radius={[0,4,4,0]} barSize={20}/></BarChart></ResponsiveContainer></CardContent></Card> );
const LeadTrendChart = ({ data }: { data: { day: string, leads: number }[] }) => ( <Card className="glass-card h-full"><CardHeader><CardTitle>Lead Generation Trend</CardTitle></CardHeader><CardContent className="h-[calc(100%-4rem)]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{left:-20,right:10}}><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" style={{fontSize:'12px'}}/><YAxis style={{fontSize:'12px'}}/><Tooltip contentStyle={{background:'rgba(255,255,255,0.8)',backdropFilter:'blur(5px)'}}/><Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#c)" strokeWidth={2}/></AreaChart></ResponsiveContainer></CardContent></Card> );
const RecentLeadsTable = ({ leads }: { leads: Lead[] }) => ( <Card className="glass-card h-full"><CardHeader><CardTitle>Recent Leads</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{leads.slice(0,3).map(l=><TableRow key={l.id}><TableCell className="font-medium">{l.name||'N/A'}</TableCell><TableCell>{l.source||'N/A'}</TableCell><TableCell>{l.status||'New'}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card> );
const DashboardSkeleton = () => ( <div className="grid gap-6 auto-rows-[120px] grid-cols-1 md:grid-cols-4"><Skeleton className="md:col-span-2 md:row-span-2 glass-card"/><Skeleton className="glass-card"/><Skeleton className="glass-card"/><Skeleton className="md:col-span-2 md:row-span-2 glass-card"/><Skeleton className="md:col-span-2 md:row-span-2 glass-card"/><Skeleton className="md:col-span-2 md:row-span-2 glass-card"/><Skeleton className="md:col-span-4 md:row-span-2 glass-card"/></div> );

const calculateStats = (leads: Lead[]): CalculatedStats | null => {
    if (!leads) return null;
    const sourceCounts = leads.reduce((acc, lead) => { if(lead.source) acc[lead.source] = (acc[lead.source] || 0) + 1; return acc; }, {} as Record<string, number>);
    const topSource = Object.keys(sourceCounts).length > 0 ? Object.keys(sourceCounts).reduce((a, b) => sourceCounts[a] > sourceCounts[b] ? a : b) : 'N/A';
    const PIE_COLORS=["#2563eb", "#60a5fa", "#93c5fd", "#dbeafe", "#1e40af"];
    const sourceData = Object.entries(sourceCounts).map(([name, value], i) => ({ name, value, fill: PIE_COLORS[i % PIE_COLORS.length] }));
    const locationCounts = leads.reduce((acc, lead) => { if(lead.location) acc[lead.location] = (acc[lead.location] || 0) + 1; return acc; }, {} as Record<string, number>);
    const locationData = Object.entries(locationCounts).map(([name, leads]) => ({ name, leads }));
    const trendData = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), leads: 0 }; }).reverse();
    leads.forEach(lead => { if (lead.createdAt) { const leadDay = lead.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'short' }); const dayData = trendData.find(d => d.day === leadDay); if (dayData) dayData.leads++; }});
    const peerData = [{ name: 'You', leads: leads.length }, { name: 'Alex Ray', leads: Math.floor(leads.length * 1.2) + 15 }, { name: 'Maria Garcia', leads: Math.floor(leads.length * 0.9) + 5 }].sort((a, b) => b.leads - a.leads);
    return { totalLeads: leads.length, topSource, sourceData, locationData, trendData, peerData, targetData: { actual: leads.length, target: 1200 } };
};

// Main Dashboard Page
export default function DashboardPage() {
    const [leads, setLeads] = useState<Lead[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { date, activePreset } = useDate();

    useEffect(() => {
        if (!date?.from) return;
        setLeads(null);
        setError(null);
        
        const fromDate = Timestamp.fromDate(date.from);
        const toDate = date.to ? Timestamp.fromDate(new Date(date.to.setHours(23, 59, 59, 999))) : fromDate;

        const q = query(collection(db, "leads"), where("createdAt", ">=", fromDate), where("createdAt", "<=", toDate));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Lead[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
            setLeads(data);
        }, (err) => { 
            setError(`Database Error: ${err.message}. Ensure Firestore indexes are configured if needed.`); 
            setLeads([]);
        });
        
        return () => unsubscribe();
    }, [date]);

    const stats = useMemo(() => leads ? calculateStats(leads) : null, [leads]);
    
    // --- THE FIX: Correctly typed variants for Framer Motion ---
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: Variants = {
        hidden: { scale: 0.95, y: 20, opacity: 0 },
        visible: { scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 120 } }
    };

    if (error) { return ( <div className="p-8"><Alert variant="destructive"><AlertTriangle /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div> ); }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="text-right">
                    <p className="text-lg font-semibold text-zinc-800">{activePreset}</p>
                    <p className="text-sm text-muted-foreground">
                        {date?.from ? ( date.to ? (<>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</>) : (format(date.from, "LLL dd, y")) ) : (<span>No date selected</span>)}
                    </p>
                </div>
            </div>

            {leads === null ? <DashboardSkeleton /> : (
                <motion.div className="grid gap-6 auto-rows-[120px] grid-cols-1 md:grid-cols-4" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2"><TargetVsActualChart actual={stats?.targetData.actual || 0} target={stats?.targetData.target || 0} /></motion.div>
                    <motion.div variants={itemVariants}><KpiCard title="Leads in Period" value={stats?.totalLeads} icon={<Users />} /></motion.div>
                    <motion.div variants={itemVariants}><KpiCard title="Top Source" valueString={stats?.topSource} icon={<PieChartIcon />} /></motion.div>
                    <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2"><PeerComparisonTable data={stats?.peerData || []} currentUser="You" /></motion.div>
                    <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2"><LeadsBySourceChart data={stats?.sourceData || []} /></motion.div>
                    <motion.div variants={itemVariants} className="md:col-span-2 md:row-span-2"><LeadsByLocationChart data={stats?.locationData || []} /></motion.div>
                    <motion.div variants={itemVariants} className="md:col-span-4 md:row-span-2"><LeadTrendChart data={stats?.trendData || []} /></motion.div>
                    <motion.div variants={itemVariants} className="md:col-span-4 md:row-span-2"><RecentLeadsTable leads={leads} /></motion.div>
                </motion.div>
            )}
        </div>
    );
}