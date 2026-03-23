"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Lead } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import Link from "next/link";

export const columns: ColumnDef<Lead>[] = [
    {
        accessorKey: "name",
        header: "Customer",
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
        accessorKey: "product_bought",
        header: "Product Bought",
    },
    {
        accessorKey: "fees_paid",
        header: "Fees Paid",
    },
    {
        accessorKey: "work_duration",
        header: "Work Duration",
    },
    {
        accessorKey: "closing_date",
        header: "Closing Date",
        cell: ({ row }) => {
            const closingDate = row.original.closing_date;
            return closingDate ? format(new Date(closingDate), 'PPP') : <span className="text-muted-foreground">N/A</span>;
        },
    },
];
