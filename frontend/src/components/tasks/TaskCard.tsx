
import React from 'react';
import { useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { openModal } from '../../store/modalSlice';
import { Task } from '@/types'; // <-- Import strong type
import { format } from 'date-fns'; // <-- Import date formatting library

interface TaskCardProps {
  task: Task; // <-- Apply strong type
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const dispatch = useDispatch();

  // Note: The backend should ideally provide the nested user and lead names.
  // The UI will gracefully handle the data if it's present.
  const assignedUserName = task.assigned_user?.name || 'N/A';
  const leadName = task.lead?.name || 'N/A';

  const handleViewDetails = () => {
    dispatch(openModal({ modalType: 'VIEW_TASK', modalProps: { task } }));
  };

  return (
    <Card className="flex flex-col justify-between h-full">
      <CardHeader className="flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <p className="text-sm text-gray-500 pt-1">For: {leadName}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleViewDetails}>
          Details
        </Button>
      </CardHeader>
      <CardContent>
        {task.description && <p className="text-sm text-gray-500 mb-4">{task.description}</p>}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400">STATUS</p>
            <Badge variant={task.status === 'Completed' ? 'default' : 'secondary'}>
              {task.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">DUE DATE</p>
            {/* Standardized date formatting */}
            <p>{format(new Date(task.due_date), 'PPP')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">ASSIGNED TO</p>
            <p>{assignedUserName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">PRIORITY</p>
            <p>{task.priority}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
