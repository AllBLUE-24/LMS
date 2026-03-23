"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetUsersQuery } from '@/store/apiSlice'; // Assuming you have a hook to get closers
import { Loader2 } from 'lucide-react';
import { Lead } from '@/types';

// Define the props for the component
interface AssignToCloserModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onSubmit: (assignmentData: any) => void;
    isLoading: boolean;
}

// Define the 12 letter options for the course selector
const courseOptions = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
const temperatureOptions = ['Hot', 'Medium', 'Cold'];
const paymentCapacityOptions = ['High', 'Medium', 'Low'];

export const AssignToCloserModal: React.FC<AssignToCloserModalProps> = ({ isOpen, onClose, lead, onSubmit, isLoading }) => {
    // State for the form fields
    const [assignedAgent, setAssignedAgent] = useState('');
    const [courseInterested, setCourseInterested] = useState('');
    const [leadTemperature, setLeadTemperature] = useState('');
    const [paymentCapacity, setPaymentCapacity] = useState('');
    const [estimatedValue, setEstimatedValue] = useState('');

    // Fetch users who are closing agents
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
    const closers = users.filter((user: any) => user.capabilities?.includes('can_close_leads'));

    // Reset form when a new lead is passed in
    useEffect(() => {
        if (lead) {
            setAssignedAgent('');
            setCourseInterested('');
            setLeadTemperature('');
            setPaymentCapacity('');
            setEstimatedValue('');
        }
    }, [lead]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignedAgent) {
            alert('Please select a closing agent.');
            return;
        }
        onSubmit({
            leadId: lead?.id,
            agentId: assignedAgent,
            course_interested: courseInterested,
            lead_temperature: leadTemperature,
            payment_capacity: paymentCapacity,
            estimated_value: parseFloat(estimatedValue) || 0,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Assign Lead to Closer</DialogTitle>
                    <DialogDescription>
                        Enrich the lead with nurturing details and assign it to a closing agent.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Agent Selector */}
                    <div>
                        <Label htmlFor="agent">Closing Agent</Label>
                        <Select onValueChange={setAssignedAgent} value={assignedAgent} required>
                            <SelectTrigger disabled={usersLoading}>
                                <SelectValue placeholder="Select a closer..." />
                            </SelectTrigger>
                            <SelectContent>
                                {closers.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Course Interested Selector */}
                    <div>
                        <Label htmlFor="course">Course Interested</Label>
                        <Select onValueChange={setCourseInterested} value={courseInterested}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a course..." />
                            </SelectTrigger>
                            <SelectContent>
                                {courseOptions.map(option => (
                                    <SelectItem key={option} value={option}>
                                        Course {option.toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Other Nurturing Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="temperature">Lead Temperature</Label>
                            <Select onValueChange={setLeadTemperature} value={leadTemperature}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select temperature..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {temperatureOptions.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="capacity">Payment Capacity</Label>
                            <Select onValueChange={setPaymentCapacity} value={paymentCapacity}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select capacity..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentCapacityOptions.map(option => (
                                        <SelectItem key={option} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="value">Estimated Value</Label>
                        <Input
                            id="value"
                            type="number"
                            value={estimatedValue}
                            onChange={(e) => setEstimatedValue(e.target.value)}
                            placeholder="e.g., 50000"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading || usersLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</> : 'Assign and Submit'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
