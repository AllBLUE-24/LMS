"use client"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

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
    header: "Role / Capabilities",
    cell: ({ row }) => {
      const capabilities = row.getValue("capabilities") as string[]
      if (!capabilities || capabilities.length === 0) return "No Capabilities";
      const isAdmin = capabilities.includes('is_admin');
      if (isAdmin) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Administrator</span>
      
      return <div className="flex flex-wrap gap-1">{capabilities.map(cap => (
          <span key={cap} className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {cap.replace(/_/g, ' ')}
          </span>
      ))}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
        // Here you would add an "Edit" button that opens a dialog
        // to call the PUT /api/v1/users/{user_id}/capabilities endpoint.
        return (
            <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        )
    }
  }
]