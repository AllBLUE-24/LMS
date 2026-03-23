"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import { Briefcase, CheckCircle, Phone, TrendingUp, XCircle } from "lucide-react"

// --- Type Definitions ---
export type GeneratedLead = {
  id: string
  name: string
  email: string
  status: string
  createdAt?: { seconds: number }
}

// --- Status Configuration ---
const statusConfig: { [key: string]: { label: string; color: string; icon: React.ElementType } } = {
  'New': { label: 'New', color: 'bg-gray-500/10 text-gray-500', icon: Briefcase },
  'Assigned': { label: 'Assigned', color: 'bg-blue-500/10 text-blue-500', icon: Briefcase },
  'Contacted': { label: 'Contacted', color: 'bg-yellow-500/10 text-yellow-500', icon: Phone },
  'Interested': { label: 'Interested', color: 'bg-purple-500/10 text-purple-500', icon: TrendingUp },
  'Closed - Won': { label: 'Closed - Won', color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
  'Closed - Lost': { label: 'Closed - Lost', color: 'bg-red-500/10 text-red-500', icon: XCircle },
  'default': { label: 'Other', color: 'bg-muted/10 text-muted-foreground', icon: Briefcase },
};

// --- Column Definitions ---
export const columns: ColumnDef<GeneratedLead>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Lead",
    cell: ({ row }) => {
        const lead = row.original
        return (
            <div>
                <div className="font-semibold text-foreground">{lead.name}</div>
                <div className="text-sm text-muted-foreground">{lead.email}</div>
            </div>
        )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Date Created",
    cell: ({ row }) => {
        const createdAt = row.original.createdAt
        if (createdAt && typeof createdAt.seconds === 'number') {
            return format(new Date(createdAt.seconds * 1000), 'LLL dd, yyyy');
        }
        return "N/A"
    }
  },
]
