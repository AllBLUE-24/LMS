from fastapi import APIRouter, Depends
from typing import List
from app.services.task_service import TaskService
from app.schemas.task import Task, TaskCreate
from app.api.v1.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Task])
async def get_tasks(
    auth: dict = Depends(get_current_user),
    task_service: TaskService = Depends()
):
    return await task_service.get_tasks_for_user(auth['tenant_id'], auth['uid'])

@router.post("/", response_model=Task)
async def create_task(
    task: TaskCreate,
    auth: dict = Depends(get_current_user),
    task_service: TaskService = Depends()
):
    return await task_service.create_task(auth['tenant_id'], task, auth['uid'])