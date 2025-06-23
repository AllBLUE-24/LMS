// FILE: src/app/(main)/admin/users/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { DataTable } from '../../leads/data-table'; // We can reuse the leads data table
import { User, columns } from './columns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus } from 'lucide-react';

// Define all available capabilities in the system
const ALL_CAPABILITIES = [
  { id: 'can_generate_leads', label: 'Can Generate Leads' },
  { id: 'can_nurture_leads', label: 'Can Nurture Leads' },
  { id: 'can_close_leads', label: 'Can Close Leads' },
  { id: 'can_reassign_leads', label: 'Can Re-assign Leads' },
  { id: 'can_view_all_reports', label: 'Can View All Reports' },
  { id: 'is_admin', label: 'Is Administrator' },
];

const inviteUserSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  capabilities: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one capability.",
  }),
});

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const form = useForm<z.infer<typeof inviteUserSchema>>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            capabilities: [],
        },
    });

    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch('http://localhost:8000/api/v1/users');
                if (!res.ok) throw new Error('Failed to fetch users');
                const data = await res.json();
                setUsers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsers();
    }, []);
    
    async function onSubmit(values: z.infer<typeof inviteUserSchema>) {
        console.log("Inviting user:", values);
        try {
            const response = await fetch('http://localhost:8000/api/v1/users/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.detail || 'Failed to invite user');
            }
            // Success! Refetch users and close dialog
            setIsLoading(true);
            const res = await fetch('http://localhost:8000/api/v1/users');
            const data = await res.json();
            setUsers(data);
            setIsDialogOpen(false);
            form.reset();

        } catch(error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <div className="container mx-auto py-10 px-4 md:px-6">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">User Management</h1>
                    <p className="text-zinc-500 mt-2">Invite and manage team members and their roles.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                         <Button><UserPlus className="mr-2 h-4 w-4"/> Invite User</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Invite New User</DialogTitle>
                            <DialogDescription>
                                Enter the user's details and assign their capabilities. They will receive an email to set up their account.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" {...form.register("name")} />
                                {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" {...form.register("email")} />
                                 {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Temporary Password</Label>
                                <Input id="password" type="password" {...form.register("password")} />
                                 {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label>Capabilities</Label>
                                <div className="space-y-2 rounded-md border p-4">
                                    {ALL_CAPABILITIES.map((item) => (
                                        <div key={item.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={item.id}
                                                onCheckedChange={(checked) => {
                                                    const currentCaps = form.getValues("capabilities");
                                                    const newCaps = checked
                                                        ? [...currentCaps, item.id]
                                                        : currentCaps.filter((cap) => cap !== item.id);
                                                    form.setValue("capabilities", newCaps);
                                                }}
                                            />
                                            <Label htmlFor={item.id} className="font-normal">{item.label}</Label>
                                        </div>
                                    ))}
                                </div>
                                 {form.formState.errors.capabilities && <p className="text-sm text-red-500">{form.formState.errors.capabilities.message}</p>}
                            </div>
                             <DialogFooter>
                                <Button type="submit">Send Invite</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>
            
            {isLoading ? <p>Loading users...</p> : <DataTable columns={columns} data={users} />}
        </div>
    );
}

