"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

// This type definition must match the data you fetch from your API
export type User = {
  id: string
  name: string
  email: string
  capabilities: string[]
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
  },
  {
    accessorKey: "capabilities",
    header: "Capabilities",
    cell: ({ row }) => {
      const capabilities = row.getValue("capabilities") as string[]
      if (!capabilities || capabilities.length === 0) {
        return <span className="text-slate-500">No Capabilities Assigned</span>
      };

      const isAdmin = capabilities.includes('admin');
      if (isAdmin) {
        return <Badge variant="destructive" className="font-semibold">Administrator</Badge>
      }
      
      return (
        <div className="flex flex-wrap gap-1">
            {capabilities.map(cap => (
                <Badge key={cap} variant="secondary" className="font-normal capitalize">
                    {cap.replace(/_/g, ' ')}
                </Badge>
            ))}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
              Copy user&apos;s email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit capabilities</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 focus:text-white focus:bg-red-500">
                Delete user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]
