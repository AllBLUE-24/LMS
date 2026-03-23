from ..repository.task_repository import TaskRepository
from ..schemas.task import TaskCreate, Task
from fastapi import Depends
from typing import List
from .notification_service import NotificationService
from ..schemas.notification import NotificationCreate

class TaskService:
    def __init__(self, repository: TaskRepository = Depends(), notification_service: NotificationService = Depends()):
        self.repository = repository
        self.notification_service = notification_service

    async def get_tasks_for_user(self, tenant_id: str, user_id: str) -> List[Task]:
        return await self.repository.get_by_user_id(tenant_id, user_id)

    async def create_task(self, tenant_id: str, task_data: TaskCreate, user_id: str) -> Task:
        # Set the assigned_to field to the user who created the task
        task_data.assigned_to = user_id
        task = await self.repository.add(tenant_id, task_data, user_id)
        
        # Create a notification for the assigned user
        if task.assigned_to:
            notification = NotificationCreate(
                user_id=task.assigned_to,
                message=f"You have been assigned a new task: {task.title}"
            )
            await self.notification_service.create_notification(tenant_id, notification)
            
        return task