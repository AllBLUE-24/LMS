"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useDate } from '@/context/DateContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LayoutDashboard, Users, ChevronsLeft, Shield, GitBranch, Calendar as CalendarIcon, Dot, Globe, LogOut, ListTodo, MessageSquare, BookMarked } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';
import { StickyNoteIcon } from 'lucide-react';
import { BriefcaseBusiness } from 'lucide-react';
import { MailCheck } from 'lucide-react';
import { useVertical } from '@/components/VerticalContextProvider';
import { MegaphoneIcon } from 'lucide-react';

// --- Placeholder Icon ---
const NurtureIcon = GitBranch;

// --- Sub-Components ---
const WorkspaceSwitcher = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const { user, lmsUser } = useAuth();
    const initials = lmsUser?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'W';

    return (
        <div className="flex items-center gap-3 p-3 border-b border-white/10 h-16 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-md">
                {initials}
            </div>
            <div className={cn("flex-1 min-w-0 transition-opacity duration-300", isCollapsed ? "opacity-0" : "opacity-100")}>
                <p className="font-semibold text-sm truncate text-foreground">{lmsUser?.name || "User"}'s Workspace</p>
                <p className="text-xs text-muted-foreground">Lead Manager</p>
            </div>
        </div>
    );
};

const SidebarNav = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const pathname = usePathname();
    const { lmsUser } = useAuth();
    const { date, setDate, activePreset, setActivePreset } = useDate();
    // --- FIXED: Correctly destructure terminology from the nested config object ---
    const { name: verticalName, config: { terminology } } = useVertical();

    const isAdmin = lmsUser?.capabilities?.includes('is_admin');
    const canGenerateLeads = lmsUser?.capabilities?.includes('can_generate_leads');
    const headOfGenerators = lmsUser?.capabilities?.includes('head_of_generators');
    const canNurture = lmsUser?.capabilities?.includes('can_nurture_leads');
    const headOfNurturers = lmsUser?.capabilities?.includes('head_of_nurturers');
    const canCloseLeads = lmsUser?.capabilities?.includes('can_close_leads');
    const headOfClosers = lmsUser?.capabilities?.includes('head_of_closers');

    // Adapt labels based on vertical terminology
    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: !isAdmin },
        { href: '/my-enquiries', label: `My Enquiries`, icon: MailCheck , visible: canCloseLeads || headOfClosers || isAdmin },
        { href: '/my-leads', label: `My Leads`, icon: MailCheck , visible: canGenerateLeads || headOfGenerators || isAdmin },
        { href: '/nurturing', label: 'Nurturing Queue', icon: NurtureIcon, visible: canNurture || headOfNurturers || isAdmin },
        { href: '/my-tasks', label: 'My Tasks', icon: StickyNoteIcon, visible: true },
        //{ href: '/chat', label: 'Chat', icon: MessageSquare, visible: true },
        { href: '/notifications', label: 'Notifications', icon: MegaphoneIcon, visible: true },
        { href: '/assign-leads', label: `Assign ${terminology.leads}`, icon: NurtureIcon, visible: isAdmin },
        { href: '/leads/all', label: `All ${terminology.leads}`, icon: MegaphoneIcon, visible: isAdmin },
        // Vertical-specific items
        { href: '/courses', label: 'Courses', icon: BookMarked, visible: verticalName === 'education' },
    ];

    const adminNavItems = [
        { href: '/dashboard1', label: 'Admin Dashboard', icon: Shield, visible: isAdmin },
        { href: '/users', label: 'User Management', icon: Users, visible: isAdmin },
        { href: '/customers', label: 'Customers', icon: BriefcaseBusiness, visible: isAdmin },
    ];

    const handleSetPreset = (preset: string | null) => {
        const now = new Date();
        setActivePreset(preset);

        if (preset === 'all_time') {
            setDate(null);
            return;
        }

        switch (preset) {
            case 'today': setDate({ from: now, to: now }); break;
            case 'this_week': setDate({ from: startOfWeek(now), to: endOfWeek(now) }); break;
            case 'this_month': setDate({ from: startOfMonth(now), to: endOfMonth(now) }); break;
            default: setDate(null); setActivePreset(null);
        }
    };

    const NavLink = ({ item, isCollapsed }: { item: typeof navItems[0], isCollapsed: boolean }) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
            <Link href={item.href} className={cn(
                "flex items-center gap-3 h-9 px-3 rounded-md text-sm font-medium transition-all duration-200 relative hover:scale-[1.02] hover:shadow-md",
                isActive
                    ? "bg-primary/10 text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-primary-foreground hover:bg-primary/5",
                isCollapsed && "justify-center"
            )}>
                <item.icon size={18} className="transition-transform" />
                <span className={cn("truncate transition-opacity", isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto')}>{item.label}</span>
                {isActive && !isCollapsed && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-500 rounded-r-full"></div>}
            </Link>
        )
    };

    return (
        <div className="flex-1 flex flex-col gap-1.5 py-4 px-2">
            {navItems.map(item => item.visible && <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />)}
            {isAdmin && <div className="my-2" />}
            {adminNavItems.map(item => item.visible && <NavLink key={item.href} item={item} isCollapsed={isCollapsed} />)}
            <div className={cn("mt-auto flex flex-col gap-1 transition-opacity", isCollapsed ? 'opacity-0 hidden' : 'opacity-100')}>
                <p className="px-3 text-xs font-semibold text-muted-foreground mt-4 tracking-wider uppercase">Date Range</p>
                <Button variant={activePreset === 'all_time' ? 'secondary' : 'ghost'} size="sm" className="justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-md" onClick={() => handleSetPreset('all_time')}><Globe className="mr-2 h-4 w-4" />All Time</Button>
                <Button variant={activePreset === 'today' ? 'secondary' : 'ghost'} size="sm" className="justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-md" onClick={() => handleSetPreset('today')}><Dot className={cn("mr-2 transition-opacity", activePreset === 'today' ? 'opacity-100 text-blue-400' : 'opacity-0')} />Today</Button>
                <Button variant={activePreset === 'this_week' ? 'secondary' : 'ghost'} size="sm" className="justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-md" onClick={() => handleSetPreset('this_week')}><Dot className={cn("mr-2 transition-opacity", activePreset === 'this_week' ? 'opacity-100 text-blue-400' : 'opacity-0')} />This Week</Button>
                <Button variant={activePreset === 'this_month' ? 'secondary' : 'ghost'} size="sm" className="justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-md" onClick={() => handleSetPreset('this_month')}><Dot className={cn("mr-2 transition-opacity", activePreset === 'this_month' ? 'opacity-100 text-blue-400' : 'opacity-0')} />This Month</Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant="outline"
                            className={cn("justify-start text-left font-normal bg-background border-input hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-md", !date && "text-muted-foreground")}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? `${format(date.from, "LLL dd")} - ${format(date.to, "LLL dd, y")}` : format(date.from, "LLL dd, y")) : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                            className="text-foreground"
                            classNames={{
                                day_selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-500",
                                day_today: "text-blue-400",
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

// --- Main Sidebar Component ---
export const Sidebar = ({ isCollapsed, setCollapsed }: { isCollapsed: boolean, setCollapsed: (fn: (prev: boolean) => boolean) => void }) => {
    const { logout } = useAuth();
    const [sidebarWidth, setSidebarWidth] = useState(isCollapsed ? 80 : 256);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLElement>(null);

    useEffect(() => {
        setSidebarWidth(isCollapsed ? 80 : 256);
    }, [isCollapsed]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !sidebarRef.current) return;
        const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
        const minWidth = 80;
        const maxWidth = 400;
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        setSidebarWidth(constrainedWidth);
        if (constrainedWidth <= 100 && !isCollapsed) {
            setCollapsed(() => true);
        } else if (constrainedWidth > 100 && isCollapsed) {
            setCollapsed(() => false);
        }
    }, [isResizing, isCollapsed, setCollapsed]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <aside
            ref={sidebarRef}
            className={cn(
                "hidden lg:flex flex-col h-full bg-sidebar text-foreground z-40 fixed top-0 left-0 transition-colors duration-300 ease-in-out shadow-lg",
            )}
            style={{ width: sidebarWidth }}
        >
            <WorkspaceSwitcher isCollapsed={isCollapsed} />
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <SidebarNav isCollapsed={isCollapsed} />
            </div>
            <div className="p-2 flex-shrink-0 flex flex-col gap-1">
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:bg-destructive/20 hover:text-destructive hover:scale-[1.02] hover:shadow-md" onClick={logout}>
                    <LogOut className="h-5 w-5" />
                    <span className={cn("transition-opacity", isCollapsed ? 'opacity-0' : 'opacity-100')}>Logout</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.02] hover:shadow-md" onClick={() => setCollapsed(p => !p)}>
                    <ChevronsLeft className={cn("transition-transform duration-300", isCollapsed && "rotate-180")} />
                    <span className={cn("transition-opacity", isCollapsed ? 'opacity-0' : 'opacity-100')}>Collapse</span>
                </Button>
            </div>
            <div
                className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-50 hover:bg-white/10 transition-colors duration-200"
                onMouseDown={handleMouseDown}
            />
        </aside>
    );
};
