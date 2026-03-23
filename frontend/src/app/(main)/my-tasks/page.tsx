'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { ListTodo, CalendarDays, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetTasksQuery, useUpdateTaskMutation, useGetUsersQuery, useGetMyLeadsQuery } from '@/store/apiSlice';

// --- Interface definitions ---
interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string | null;
  isCompleted: boolean;
  lead_id: string;
  assigned_to: string;
}
interface User {
  id: string;
  name: string;
}
interface Lead {
  id: string;
  name: string;
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const MyTasksPage = () => {
  // --- RTK Query Data Fetching ---
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useGetTasksQuery();
  const { data: users = [], isLoading: usersLoading, error: usersError } = useGetUsersQuery();
  const { data: leadsData, isLoading: leadsLoading, error: leadsError } = useGetMyLeadsQuery();
  const leads = leadsData?.leads || [];
  const [updateTask] = useUpdateTaskMutation();

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    try {
      await updateTask({ id: taskId, isCompleted: !isCompleted }).unwrap();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  if (tasksLoading || usersLoading || leadsLoading) {
    return <MyTasksSkeleton />;
  }

  const combinedError = tasksError || usersError || leadsError;
  if (combinedError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive">Error loading task data.</p>
        <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 space-y-6 p-4 md:p-8"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    >
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">Here's a list of your assigned tasks.</p>
        </div>
        <Link href="/my-tasks/new" passHref>
          <Button>Create New Task</Button>
        </Link>
      </motion.div>

      <div className="mt-8 space-y-4">
        {tasks.length === 0 ? (
          <motion.div variants={itemVariants} className="flex flex-col items-center justify-center p-8 border rounded-lg text-muted-foreground">
            <ListTodo size={48} className="mb-4" />
            <p className="text-lg font-semibold">No tasks found!</p>
            <p className="text-sm">Looks like you're all caught up. Great job!</p>
          </motion.div>
        ) : (
          tasks.map((task: Task) => {
            const assignedUser = users.find((user) => user.id === task.assigned_to);
            const associatedLead = leads.find((lead) => lead.id === task.lead_id);
            return (
              <motion.div key={task.id} variants={itemVariants}>
                <Card className={task.isCompleted ? 'opacity-70' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className={`text-lg font-semibold ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </CardTitle>
                    <Checkbox
                      checked={task.isCompleted}
                      onCheckedChange={() => handleToggleComplete(task.id, task.isCompleted)}
                      aria-label="Mark task as complete"
                    />
                  </CardHeader>
                  <CardContent>
                    {task.description && <p className="text-sm text-muted-foreground mb-2">{task.description}</p>}
                    {task.dueDate && new Date(task.dueDate).toString() !== 'Invalid Date' && (
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <CalendarDays size={14} className="mr-1" />
                        <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned To: {assignedUser ? assignedUser.name : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lead: {associatedLead ? associatedLead.name : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default MyTasksPage;

// --- Skeleton Component ---
const MyTasksSkeleton = () => (
  <div className="flex-1 space-y-6 p-4 md:p-8 animate-pulse">
    <div className="mb-6">
      <Skeleton className="h-9 w-64 mb-2" />
      <Skeleton className="h-5 w-80" />
    </div>
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-5 rounded-sm" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);