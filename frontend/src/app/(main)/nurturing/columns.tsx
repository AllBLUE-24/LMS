"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Lead } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import Link from "next/link";

export const columns = (onUpdateClick: (lead: Lead) => void): ColumnDef<Lead>[] => [
    {
        accessorKey: "name",
        header: "Lead",
        cell: ({ row }) => {
            const lead = row.original;
            return (
                <Link href={`/leads/${lead.id}`} className="hover:underline">
                    <div className="font-semibold text-foreground">{lead.name}</div>
                    <div className="text-sm text-muted-foreground">{lead.email}</div>
                </Link>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return <Badge variant="outline">{status}</Badge>;
        },
    },
    {
        accessorKey: "next_call_date",
        header: "Next Call Date",
        cell: ({ row }) => {
            const nextCallDate = row.original.next_call_date;
            return nextCallDate ? format(new Date(nextCallDate), 'PPP p') : <span className="text-muted-foreground">N/A</span>;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const lead = row.original;
            return (
                <div className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onUpdateClick(lead)}>
                        Update
                    </Button>
                </div>
            );
        },
    },
];
