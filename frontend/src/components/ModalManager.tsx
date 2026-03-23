
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import TaskForm from '../components/tasks/TaskForm';
import TaskDetailModal from '../components/tasks/TaskDetailModal';

const ModalManager: React.FC = () => {
  const { modalType, modalProps } = useSelector((state: RootState) => state.modal);

  if (!modalType) {
    return null;
  }

  const ModalComponent = {
    CREATE_TASK: TaskForm,
    EDIT_TASK: TaskForm,
    VIEW_TASK: TaskDetailModal,
  }[modalType];

  return <ModalComponent {...modalProps} />;
};

export default ModalManager;
