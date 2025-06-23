// FILE: src/context/DateContext.tsx

"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface DateContextType {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  activePreset: string;
  setActivePreset: (preset: string) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const useDate = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDate must be used within a DateProvider');
  }
  return context;
};

export const DateProvider = ({ children }: { children: ReactNode }) => {
  const [date, setDate] = useState<DateRange | undefined>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }));
  const [activePreset, setActivePreset] = useState<string>("This Month");

  const value = { date, setDate, activePreset, setActivePreset };

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
};