
import React from 'react';
import { useDispatch } from 'react-redux';
import { useGetTasksQuery } from '../../store/apiSlice';
import TaskCard from './TaskCard';
import { Button } from '../ui/button';
import { openModal } from '../../store/modalSlice';
import { Task } from '@/types';

// Skeleton Loader Component
const TaskCardSkeleton: React.FC = () => (
  <div className="p-4 border rounded-lg shadow-sm bg-white animate-pulse">
    <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const TaskList: React.FC = () => {
  const dispatch = useDispatch();
  const { data: tasks = [], isLoading, error } = useGetTasksQuery();

  const handleCreateTask = () => {
    dispatch(openModal({ modalType: 'CREATE_TASK' }));
  };

  if (error) {
    return <div className="text-red-500">Error: {'Failed to fetch tasks'}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Tasks</h2>
        <Button onClick={handleCreateTask}>Create Task</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </>
        ) : (
          tasks.map((task: Task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
};

export default TaskList;
