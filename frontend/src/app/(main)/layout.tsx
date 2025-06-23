// FILE: src/app/(main)/layout.tsx

"use client";

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { DateProvider, useDate } from '@/context/DateContext';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LayoutDashboard, Megaphone, ChevronsLeft, Calendar as CalendarIcon, Upload, Shield } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

// --- AUTH CONTEXT TO SHARE USER DATA ---
interface AuthContextType {
  user: FirebaseUser | null;
  lmsUser: any | null;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};

// --- SIDEBAR AND HEADER COMPONENTS ---
const WorkspaceSwitcher = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const { user, lmsUser } = useAuth();
    const initials = lmsUser?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'W';
    return (
        <div className="flex items-center gap-3 p-3 border-b border-zinc-800 h-16">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                {initials}
            </div>
            <div className={cn("flex-1 min-w-0", isCollapsed && "hidden")}>
                <p className="font-semibold text-sm truncate text-slate-100">{lmsUser?.name || "User"}'s Workspace</p>
            </div>
        </div>
    );
};

const SidebarNav = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const pathname = usePathname();
    const { date, setDate, activePreset, setActivePreset } = useDate();
    const { lmsUser } = useAuth();
    const isAdmin = lmsUser?.capabilities?.includes('is_admin');

    const setPreset = (preset: string) => {
        setActivePreset(preset);
        const today = new Date();
        if (preset === "Today") setDate({ from: today, to: today });
        else if (preset === "This Week") setDate({ from: startOfWeek(today), to: endOfWeek(today) });
        else if (preset === "This Month") setDate({ from: startOfMonth(today), to: endOfMonth(today) });
    };
    
    return (
        <nav className="flex-1 flex flex-col gap-1 py-4 px-2">
             <Link href="/dashboard" className={cn("flex items-center gap-3 h-9 px-3 rounded-md text-sm font-medium transition-colors", pathname === "/dashboard" ? "bg-zinc-700 text-white" : "text-slate-300 hover:bg-zinc-800/50", isCollapsed && "justify-center")}>
                 <LayoutDashboard size={18} />
                 <span className={cn("truncate", isCollapsed && "hidden")}>Dashboard</span>
             </Link>
             <Link href="/leads/all" className={cn("flex items-center gap-3 h-9 px-3 rounded-md text-sm font-medium transition-colors", pathname.startsWith("/leads") ? "bg-zinc-700 text-white" : "text-slate-300 hover:bg-zinc-800/50", isCollapsed && "justify-center")}>
                 <Megaphone size={18} />
                 <span className={cn("truncate", isCollapsed && "hidden")}>All Leads</span>
             </Link>
             
             {isAdmin && (
                <div className="border-t border-zinc-700/50 my-2 pt-2">
                     <Link href="/users" className={cn("flex items-center gap-3 h-9 px-3 rounded-md text-sm font-medium transition-colors", pathname.startsWith("/users") ? "bg-zinc-700 text-white" : "text-slate-300 hover:bg-zinc-800/50", isCollapsed && "justify-center")}>
                         <Shield size={18} />
                         <span className={cn("truncate", isCollapsed && "hidden")}>Admin</span>
                     </Link>
                </div>
             )}
            
            <div className="mt-4 px-1">
                {!isCollapsed && <h3 className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Filter Data By Date</h3>}
                <Button variant={activePreset === "Today" ? "secondary" : "ghost"} size="sm" className="w-full justify-start gap-2" onClick={() => setPreset("Today")}>
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    {!isCollapsed && "Today"}
                </Button>
                <Button variant={activePreset === "This Week" ? "secondary" : "ghost"} size="sm" className="w-full justify-start gap-2" onClick={() => setPreset("This Week")}>
                   <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    {!isCollapsed && "This Week"}
                </Button>
                 <Button variant={activePreset === "This Month" ? "secondary" : "ghost"} size="sm" className="w-full justify-start gap-2" onClick={() => setPreset("This Month")}>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {!isCollapsed && "This Month"}
                </Button>
            </div>
            
            <div className="mt-auto px-1">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={activePreset === 'Custom' ? "secondary" : "ghost"} className={cn("w-full justify-start text-sm", isCollapsed && "justify-center p-0 h-9 w-9")}>
                            <CalendarIcon className={cn("h-4 w-4", !isCollapsed && "mr-2")}/>
                            {!isCollapsed && <span>Custom Range</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" side="right" align="start">
                        <Calendar mode="range" selected={date} onSelect={(range) => { setDate(range); setActivePreset("Custom"); }}/>
                    </PopoverContent>
                </Popover>
            </div>
        </nav>
    );
};

const Header = () => {
    // --- THE FIX ---
    // We use the auth hook to get the user's capabilities
    const { lmsUser } = useAuth();
    const canGenerateLeads = lmsUser?.capabilities?.includes('can_generate_leads');
    const isAdmin = lmsUser?.capabilities?.includes('is_admin');
    const pathname = usePathname();

    let portalTitle = "Lead Management Portal";
    if (pathname.startsWith('/users')) {
        portalTitle = "Administrator Portal";
    } else if (canGenerateLeads && !isAdmin) {
        portalTitle = "Lead Generator Portal";
    }

    return (
         <header className="bg-white/70 backdrop-blur-lg sticky top-0 z-20 border-b border-slate-200">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
                <div className="text-sm font-medium text-zinc-900">{portalTitle}</div>
                 <div className="flex items-center gap-4">
                    {/* The "Import Leads" button is now only visible if the user has the correct capability */}
                    {canGenerateLeads && (
                        <Button asChild variant="outline" size="sm" className="glass-card">
                            <Link href="/import">
                                <Upload size={16} className="mr-2" />
                                Import Leads
                            </Link>
                        </Button>
                    )}
                 </div>
            </div>
        </header>
    )
}

// --- The Main Layout Component that renders the UI ---
function AppShell({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setCollapsed] = useState(false);
    return (
        <div className="flex h-screen bg-slate-50">
            <aside className={cn("hidden lg:flex flex-col h-full bg-zinc-900 text-slate-200 z-40 transition-all duration-300 ease-in-out", isCollapsed ? "w-20" : "w-64")}>
                <WorkspaceSwitcher isCollapsed={isCollapsed} />
                <SidebarNav isCollapsed={isCollapsed} />
                <div className="p-2 border-t border-zinc-800">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-zinc-800/50 hover:text-white" onClick={() => setCollapsed(p => !p)}>
                        <ChevronsLeft className={cn("transition-transform", isCollapsed && "rotate-180")}/>
                        <span className={cn(isCollapsed && "hidden")}>Collapse</span>
                    </Button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}

// --- The Final Export ---
export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [lmsUser, setLmsUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
                    setUser(firebaseUser);
                    setLmsUser(doc.exists() ? { id: doc.id, ...doc.data() } : null);
                    setLoading(false);
                }, (error) => { setLoading(false); });
                return () => unsubscribeFirestore();
            } else {
                setLoading(false);
                router.push('/login');
            }
        });
        return () => unsubscribeAuth();
    }, [router]);
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LayoutDashboard className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ user, lmsUser }}>
            <DateProvider>
                <AppShell>
                    {children}
                </AppShell>
            </DateProvider>
        </AuthContext.Provider>
    );
}