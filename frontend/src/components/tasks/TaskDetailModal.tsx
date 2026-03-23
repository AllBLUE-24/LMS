
import React from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { closeModal } from '../../store/modalSlice';
import { Task } from '@/types'; // <-- Import strong type
import { format } from 'date-fns'; // <-- Import date formatting library

interface TaskDetailModalProps {
  task: Task; // <-- Apply strong type
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task }) => {
  const dispatch = useDispatch();

  if (!task) return null;

  // Rely on the nested data from the backend, falling back gracefully.
  const assignedUserName = task.assigned_user?.name || 'N/A';
  const leadName = task.lead?.name || 'N/A';

  return (
    <Dialog open={true} onOpenChange={() => dispatch(closeModal())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          {task.description && <DialogDescription className="pt-2">{task.description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-semibold">Status:</p>
            <p>{task.status}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-semibold">Due Date:</p>
            {/* Standardized date formatting */}
            <p>{format(new Date(task.due_date), 'PPP')}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-semibold">Assigned To:</p>
            <p>{assignedUserName}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-semibold">Associated Lead:</p>
            <p>{leadName}</p>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <p className="font-semibold">Priority:</p>
            <p>{task.priority}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => dispatch(closeModal())}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
