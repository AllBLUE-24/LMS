import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useGetUsersQuery, useGetMyLeadsQuery } from '@/store/apiSlice';
import { Task } from '@/types'; // Assuming a Task interface is defined in types

interface TaskFormProps {
  taskToEdit?: Task;
  onSubmit: (taskData: Partial<Task>) => void;
  isLoading: boolean;
  onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ taskToEdit, onSubmit, isLoading, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [assigned_to, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [selectedLead, setSelectedLead] = useState('');

  // --- RTK Query Hooks ---
  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();
  const { data: leadsData, isLoading: leadsLoading } = useGetMyLeadsQuery();
  const leads = leadsData?.leads || [];

  // Pre-populate form if in "edit" mode
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setDueDate(taskToEdit.due_date ? new Date(taskToEdit.due_date) : undefined);
      setAssignedTo(taskToEdit.assigned_to || '');
      setPriority(taskToEdit.priority || 'Medium');
      setStatus(taskToEdit.status || 'Pending');
      setSelectedLead(taskToEdit.lead_id || '');
    }
  }, [taskToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      // Consider using a more robust notification system like toast
      alert('Please fill in the title field.');
      return;
    }

    onSubmit({
      id: taskToEdit?.id,
      title,
      description,
      due_date: dueDate?.toISOString(),
      assigned_to,
      lead_id: selectedLead,
      priority,
      status,
      isCompleted: status === 'Completed',
    });
  };

  const formTitle = taskToEdit ? 'Edit Task' : 'Create New Task';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h2 className="text-xl font-semibold text-foreground">{formTitle}</h2>

      <div>
        <Label htmlFor="title">Task Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Follow up with client" required />
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details about the task..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lead">Lead</Label>
          <Select value={selectedLead} onValueChange={setSelectedLead} disabled={!!taskToEdit}>
            <SelectTrigger disabled={leadsLoading}><SelectValue placeholder="Select a lead" /></SelectTrigger>
            <SelectContent>
              {leads.map((l: any) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="assigned_to">Assign To</Label>
          <Select value={assigned_to} onValueChange={setAssignedTo}>
            <SelectTrigger disabled={usersLoading}><SelectValue placeholder="Select a user" /></SelectTrigger>
            <SelectContent>
              {users.map((u: any) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!dueDate && "text-muted-foreground"}`}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus /></PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : (taskToEdit ? 'Update Task' : 'Create Task')}
        </Button>
      </div>
    </form>
  );
};
