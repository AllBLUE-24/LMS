"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';
import { ThemeToggle } from './ThemeToggle';
import { usePageTitle } from '@/context/PageTitleContext';

export const Header = () => {
    const { lmsUser } = useAuth();
    const canGenerateLeads = lmsUser?.capabilities?.includes('can_generate_leads') || lmsUser?.capabilities?.includes('is_admin') || lmsUser?.capabilities?.includes('head_of_generators');
    const pathname = usePathname();
    const { pageTitle } = usePageTitle();

    const breadcrumbs = pathname.split('/').filter(segment => segment !== '').map((segment, index, array) => {
        const href = '/' + array.slice(0, index + 1).join('/');
        const isLast = index === array.length - 1;
        let displaySegment = segment.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        if (isLast && pageTitle) {
            displaySegment = pageTitle;
        }

        return (
            <React.Fragment key={href}>
                <Link href={href} className={`text-sm ${isLast ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-primary'}`}>
                    {displaySegment}
                </Link>
                {!isLast && <span className="mx-2 text-muted-foreground"> &gt; </span>}
            </React.Fragment>
        );
    });
    
    return (
        <header className="bg-background/70 backdrop-blur-lg sticky top-0 z-30 border-b">
            <div className="flex items-center justify-between h-16 px-4 md:px-6">
                <nav className="flex items-center">
                    {breadcrumbs.length > 0 ? breadcrumbs : <span className="text-sm text-foreground font-semibold">Dashboard</span>}
                </nav>
                <div className="flex items-center gap-4">
                    {canGenerateLeads && (
                        <Button asChild variant="outline" size="sm">
                            <Link href="/import">
                                <Upload size={16} className="mr-2" />
                                Import Leads
                            </Link>
                        </Button>
                    )}
                    <NotificationIcon />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
};


