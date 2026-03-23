"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Lead } from '@/types';

interface FollowUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onSubmit: (followUpData: any) => void;
    isLoading: boolean;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({ isOpen, onClose, lead, onSubmit, isLoading }) => {
    const [nextCallDate, setNextCallDate] = useState<Date | undefined>();
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (lead) {
            setNextCallDate(lead.next_call_date ? new Date(lead.next_call_date) : undefined);
            setReason('');
            setNote('');
        }
    }, [lead]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nextCallDate || !reason) {
            alert('Please provide a date and a reason for the follow-up.');
            return;
        }
        onSubmit({
            leadId: lead?.id,
            next_call_date: nextCallDate.toISOString(),
            reason,
            note,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Schedule Follow-Up</DialogTitle>
                    <DialogDescription>
                        Set a new date for the next call and add a note for context.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="nextCallDate">Next Call Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={`w-full justify-start text-left font-normal ${!nextCallDate && "text-muted-foreground"}`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {nextCallDate ? format(nextCallDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={nextCallDate} onSelect={setNextCallDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Label htmlFor="reason">Reason for Follow-up</Label>
                        <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Discuss pricing" required />
                    </div>
                    <div>
                        <Label htmlFor="note">Note / Conversation</Label>
                        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add details from your conversation..." />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Schedule'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
