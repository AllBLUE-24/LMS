"use client";

import React, { useState, ReactNode } from 'react';

import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppShell = ({ children }: { children: ReactNode }) => {
    const [isCollapsed, setCollapsed] = useState(false);
    
    // Dynamically calculate the left padding for the main content
    const mainContentPadding = isCollapsed ? '5rem' : '16rem'; // 80px or 256px

    return (
        <div className="flex h-screen">
            <Sidebar 
                isCollapsed={isCollapsed} 
                setCollapsed={setCollapsed} 
            />
            <main 
                className={`transition-all duration-300 ease-in-out w-full ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}
            >
                <Header />
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};
