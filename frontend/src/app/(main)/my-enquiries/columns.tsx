"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AssignedLead } from "@/types"

// --- Column Definitions ---
export const columns = (onUpdateClick: (lead: AssignedLead) => void): ColumnDef<AssignedLead>[] => [
  {
    accessorKey: "name",
    header: "Lead",
    cell: ({ row }) => {
        const lead = row.original
        return (
            <Link href={`/leads/${lead.id}`} className="hover:underline">
                <div className="font-semibold text-foreground">{lead.name}</div>
                <div className="text-sm text-muted-foreground">{lead.email}</div>
            </Link>
        )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        const status = row.getValue("status") as string
        return <Badge variant="outline">{status}</Badge>
    }
  },
  {
    accessorKey: "next_meet_date",
    header: "Next Meet Date",
    cell: ({ row }) => {
        const nextMeetDate = row.original.next_meet_date;
        return nextMeetDate ? format(new Date(nextMeetDate), 'PPP p') : <span className="text-muted-foreground">N/A</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original
      return (
        <div className="text-right">
            <Button variant="ghost" size="sm" onClick={() => onUpdateClick(lead)}>
                Update
            </Button>
        </div>
      )
    },
  },
]