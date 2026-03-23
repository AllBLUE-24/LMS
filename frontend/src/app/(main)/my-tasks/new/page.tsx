'use client';

import React, { useState } from 'react';
import TasksDialog from '@/components/tasks/TasksDialog';
import { useRouter } from 'next/navigation';

const NewTaskPage = () => {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleClose = () => {
    setIsDialogOpen(false);
    router.back();
  };

  return (
    <TasksDialog
      isOpen={isDialogOpen}
      onClose={handleClose}
    />
  );
};

export default NewTaskPage;