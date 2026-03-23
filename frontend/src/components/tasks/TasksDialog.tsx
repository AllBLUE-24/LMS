import React from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TaskForm } from './TaskForm';
import { useCreateTaskMutation } from '@/store/apiSlice';
import { Task } from '@/types';
import { toast } from 'sonner';

interface TasksDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TasksDialog: React.FC<TasksDialogProps> = ({ isOpen, onClose }) => {
  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      await createTask(taskData).unwrap();
      toast.success('Task created successfully!');
      onClose(); // Close the dialog on success
    } catch (err) {
      toast.error('Failed to create task. Please try again.');
      console.error('Error creating task:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <TaskForm
          onSubmit={handleCreateTask}
          isLoading={isCreatingTask}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TasksDialog;
