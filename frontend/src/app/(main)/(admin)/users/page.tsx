"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/app/(main)/leads/data-table';
import { User, columns } from './columns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetUsersQuery, useInviteUserMutation } from '@/store/apiSlice'; // <-- Using RTK Query hooks

// Define all available capabilities in the system
const ALL_CAPABILITIES = [
  { id: 'is_admin', label: 'Is Administrator' },
  { id: 'can_generate_leads', label: 'Can Generate Leads' },
  { id: 'head_of_generators', label: 'Head of Generators' },
  { id: 'can_nurture_leads', label: 'Can Nurture Leads' },
  { id: 'head_of_nurturers', label: 'Head of Nurturers' },
  { id: 'can_close_leads', label: 'Can Close Leads' },
  { id: 'head_of_closers', label: 'Head of Closers' },
  { id: 'can_reassign_leads', label: 'Can Re-assign Leads' },
  { id: 'can_view_all_reports', label: 'Can View All Reports' },
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // --- RTK Query Hooks for data fetching and mutation ---
    const { data: users = [], isLoading, error } = useGetUsersQuery();
    const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation();
    
    const form = useForm<z.infer<typeof inviteUserSchema>>({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            capabilities: [],
        },
    });

    // Effect to reset form and close dialog on successful submission
    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            form.reset();
            setIsDialogOpen(false);
        }
    }, [form.formState.isSubmitSuccessful, form.reset]);
    
    async function onSubmit(values: z.infer<typeof inviteUserSchema>) {
        try {
            await inviteUser(values).unwrap(); // .unwrap() will throw on error, simplifying error handling
        } catch(error: any) {
            const message = error.data?.detail || 'Failed to invite user';
            form.setError("root", { type: "manual", message: message });
            console.error(`Error: ${message}`);
        }
    }

    const TableSkeleton = () => (
        <div className="space-y-3 mt-4">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="rounded-md border">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );

    return (
        <div>
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">User Management</h1>
                    <p className="text-zinc-500 mt-2">Invite and manage team members and their capabilities.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                         <Button><UserPlus className="mr-2 h-4 w-4"/> Invite User</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Invite New User</DialogTitle>
                            <DialogDescription>
                                Enter the user&apos;s details and assign their capabilities.
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
                                                checked={(form.watch("capabilities") || []).includes(item.id)}
                                                onCheckedChange={(checked) => {
                                                    const currentCaps = form.getValues("capabilities");
                                                    const newCaps = checked
                                                        ? [...currentCaps, item.id]
                                                        : currentCaps.filter((cap) => cap !== item.id);
                                                    form.setValue("capabilities", newCaps, { shouldValidate: true });
                                                }}
                                            />
                                            <Label htmlFor={item.id} className="font-normal">{item.label}</Label>
                                        </div>
                                    ))}
                                </div>
                                 {form.formState.errors.capabilities && <p className="text-sm text-red-500">{form.formState.errors.capabilities.message}</p>}
                            </div>
                            {form.formState.errors.root && <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>}
                             <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isInviting}>
                                    {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Send Invite
                                </Button>
                             </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>
            
            {error && <div className="text-red-500">Error loading users: {String(error)}</div>}
            {isLoading ? <TableSkeleton /> : <DataTable columns={columns} data={users} users={users} />}
        </div>
    );
}