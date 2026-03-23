"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateLeadMutation, useQualifyLeadMutation, useScheduleFollowUpMutation, useGetClosersQuery, useAssignToCloserMutation, useScheduleMeetingMutation, useCloseLeadMutation } from '@/store/apiSlice';
import { Lead } from '@/app/(main)/leads/columns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface InteractionModalProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
}

// --- Constants ---
const COURSE_OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

export const InteractionModal: React.FC<InteractionModalProps> = ({ lead, isOpen, onClose }) => {
    const { lmsUser } = useAuth();
    const [status, setStatus] = useState('');
    const [notes, setNotes] = useState('');
    const [nextCallDate, setNextCallDate] = useState('');
    const [nextMeetDate, setNextMeetDate] = useState('');
    const [qualificationData, setQualificationData] = useState({
        interestedProduct: '',
        temperature: '',
        value: '',
        timeline: '',
        dealStage: '',
        notes: '',
    });
    const [closingData, setClosingData] = useState({
        fees_paid: '',
        work_duration: '',
        product_bought: '',
        closing_notes: '',
    });
    const [selectedCloser, setSelectedCloser] = useState<string | null>(null);

    const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
    const [qualifyLead, { isLoading: isQualifying }] = useQualifyLeadMutation();
    const [scheduleFollowUp, { isLoading: isScheduling }] = useScheduleFollowUpMutation();
    const [scheduleMeeting, { isLoading: isSchedulingMeeting }] = useScheduleMeetingMutation();
    const [closeLead, { isLoading: isClosing }] = useCloseLeadMutation();
    const [assignToCloser, { isLoading: isAssigning }] = useAssignToCloserMutation();
    const { data: closers = [], isLoading: isLoadingClosers } = useGetClosersQuery();

    useEffect(() => {
        if (lead) {
            setStatus(lead.status);
            setNotes('');
            setNextCallDate('');
            setNextMeetDate('');
            setQualificationData({ interestedProduct: '', temperature: '', value: '', timeline: '', dealStage: '', notes: '' });
            setClosingData({ fees_paid: '', work_duration: '', product_bought: '', closing_notes: '' });
        }
    }, [lead]);

    const handleStatusChange = (newStatus: string) => setStatus(newStatus);
    const handleQualificationDataChange = (field: string, value: string) => setQualificationData(prev => ({ ...prev, [field]: value }));
    const handleClosingDataChange = (field: string, value: string) => setClosingData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!lead) return;
        try {
            if (status === 'Interested') {
                await updateLead({ id: lead.id, status: 'Interested', notes: qualificationData.notes }).unwrap();
                toast.success('Lead status updated to "Interested".');
                onClose();
            } else if (status === 'Follow-up') {
                await scheduleFollowUp({ leadId: lead.id, next_call_date: nextCallDate, reason: 'Follow-up', note: notes }).unwrap();
                toast.success('Follow-up scheduled');
                onClose();
            } else if (status === 'Closed - Won') {
                await closeLead({ leadId: lead.id, ...closingData }).unwrap();
                toast.success('Lead closed successfully');
                onClose();
            } else {
                await updateLead({ id: lead.id, status, notes }).unwrap();
                toast.success(`Lead status updated to "${status}"`);
                onClose();
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleScheduleMeeting = async () => {
        if (!lead) return;
        try {
            await scheduleMeeting({ leadId: lead.id, meetingTime: nextMeetDate, location: 'Online' }).unwrap();
            toast.success('Meeting scheduled');
            onClose();
        } catch (error) {
            toast.error('Failed to schedule meeting');
        }
    };

    const handleAssignToCloser = async () => {
        if (!lead || !selectedCloser) return;
        if (!isQualificationComplete) {
            toast.error("Please fill out all qualification details before assigning.");
            return;
        }
        try {
            await qualifyLead({ leadId: lead.id, ...qualificationData }).unwrap();
            await assignToCloser({ leadId: lead.id, agentId: selectedCloser }).unwrap();
            toast.success('Lead qualified and assigned to closer');
            onClose();
        } catch (error: any) {
            toast.error(error.data?.detail || 'Failed to assign lead');
        }
    };

    if (!lead) return null;

    const isQualificationComplete = qualificationData.interestedProduct && qualificationData.temperature && qualificationData.value && qualificationData.timeline && qualificationData.dealStage;
    const isCloser = lmsUser?.capabilities.includes('can_close_leads');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>Interact with {lead.name}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select onValueChange={handleStatusChange} defaultValue={status}>
                            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Contacted">Contacted</SelectItem>
                                <SelectItem value="Interested">Interested</SelectItem>
                                <SelectItem value="Not Interested">Not Interested</SelectItem>
                                <SelectItem value="Follow-up">Follow-up</SelectItem>
                                {isCloser && <SelectItem value="Meeting Scheduled">Meeting Scheduled</SelectItem>}
                                {isCloser && <SelectItem value="Closed - Won">Closed - Won</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    {status === 'Interested' && !isCloser && (
                        <div className="grid grid-cols-1 gap-4 mt-4 border-t pt-4">
                            <h3 className="font-semibold text-lg">Qualify Lead</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Interested Product</Label><Select onValueChange={value => handleQualificationDataChange('interestedProduct', value)}><SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger><SelectContent>{COURSE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>Course {opt.toUpperCase()}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label>Temperature</Label><Select onValueChange={value => handleQualificationDataChange('temperature', value)}><SelectTrigger><SelectValue placeholder="Select temperature" /></SelectTrigger><SelectContent><SelectItem value="Hot">Hot</SelectItem><SelectItem value="Cold">Cold</SelectItem><SelectItem value="Warm">Warm</SelectItem></SelectContent></Select></div>
                                <div><Label>Value</Label><Input type="number" onChange={e => handleQualificationDataChange('value', e.target.value)} /></div>
                                <div><Label>Timeline</Label><Input onChange={e => handleQualificationDataChange('timeline', e.target.value)} /></div>
                                <div><Label>Deal Stage</Label><Input onChange={e => handleQualificationDataChange('dealStage', e.target.value)} /></div>
                            </div>
                            <Textarea placeholder="Qualification Notes..." onChange={e => handleQualificationDataChange('notes', e.target.value)} />
                        </div>
                    )}

                    {status === 'Closed - Won' && isCloser && (
                        <div className="grid grid-cols-1 gap-4 mt-4 border-t pt-4">
                            <h3 className="font-semibold text-lg">Closing Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Fees Paid</Label><Input type="number" onChange={e => handleClosingDataChange('fees_paid', e.target.value)} /></div>
                                <div><Label>Work Duration</Label><Input onChange={e => handleClosingDataChange('work_duration', e.target.value)} /></div>
                                <div><Label>Product Bought</Label><Input onChange={e => handleClosingDataChange('product_bought', e.target.value)} /></div>
                            </div>
                            <Textarea placeholder="Closing Notes..." onChange={e => handleClosingDataChange('closing_notes', e.target.value)} />
                        </div>
                    )}

                    {status === 'Follow-up' && <div className="grid gap-2 mt-4 border-t pt-4"><Label htmlFor="nextCallDate">Next Call Date</Label><Input id="nextCallDate" type="datetime-local" value={nextCallDate} onChange={e => setNextCallDate(e.target.value)} /><Label htmlFor="notes">Notes</Label><Textarea id="notes" placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} /></div>}
                    {isCloser && <div className="grid gap-2 mt-4 border-t pt-4"><Label htmlFor="nextMeetDate">Next Meet Date</Label><Input id="nextMeetDate" type="datetime-local" value={nextMeetDate} onChange={e => setNextMeetDate(e.target.value)} /></div>}
                    {status !== 'Interested' && status !== 'Follow-up' && !isCloser && <div className="grid gap-2 mt-4 border-t pt-4"><Label htmlFor="notes">Notes</Label><Textarea id="notes" placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} /></div>}

                    {status === 'Interested' && !isCloser && (
                         <div className="mt-4 border-t pt-4">
                            <h3 className="font-semibold text-lg">Assign to Closer</h3>
                            <div className="flex items-center gap-4 mt-2">
                                <Select onValueChange={setSelectedCloser} disabled={isLoadingClosers}><SelectTrigger className="flex-1"><SelectValue placeholder="Select a closer" /></SelectTrigger><SelectContent>{closers.map((closer: any) => (<SelectItem key={closer.id} value={closer.id}>{closer.name}</SelectItem>))}</SelectContent></Select>
                                <Button onClick={handleAssignToCloser} disabled={isAssigning || !selectedCloser || !isQualificationComplete}>{isAssigning ? 'Assigning...' : 'Qualify & Assign'}</Button>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    {status !== 'Interested' && !isCloser && (
                        <Button onClick={handleSubmit} disabled={isUpdating || isScheduling}>
                            {isUpdating || isScheduling ? 'Saving...' : 'Save'}
                        </Button>
                    )}
                    {status === 'Interested' && !isCloser && (
                        <Button onClick={handleSubmit} disabled={isUpdating || isScheduling}>
                            {isUpdating || isScheduling ? 'Saving...' : 'Save as Interested'}
                        </Button>
                    )}
                    {isCloser && status !== 'Closed - Won' && <Button onClick={handleScheduleMeeting} disabled={isSchedulingMeeting}>{isSchedulingMeeting ? 'Saving...' : 'Schedule Meeting'}</Button>}
                    {isCloser && status === 'Closed - Won' && <Button onClick={handleSubmit} disabled={isClosing}>{isClosing ? 'Saving...' : 'Save'}</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};