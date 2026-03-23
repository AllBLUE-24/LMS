from ..db.firestore import db
from ..schemas.task import Task
from typing import List
from google.cloud.firestore_v1.base_query import FieldFilter
from ..schemas.task import Task, TaskCreate 
from google.cloud.firestore_v1.async_client import AsyncClient

class TaskRepository:
    def __init__(self):
        self.db: AsyncClient = db

    def _get_collection_ref(self, tenant_id: str):
        return self.db.collection(f'tenants/{tenant_id}/tasks')

    async def get_by_user_id(self, tenant_id: str, user_id: str) -> List[Task]:
        collection_ref = self._get_collection_ref(tenant_id)
        tasks = []
        docs_stream = collection_ref.where(filter=FieldFilter('assigned_to', '==', user_id)).stream()
        async for doc in docs_stream:
            task_data = doc.to_dict()
            task_data['id'] = doc.id
            tasks.append(Task(**task_data))
        return tasks

    async def add(self, tenant_id: str, task_data: TaskCreate, user_id: str) -> Task:
        collection_ref = self._get_collection_ref(tenant_id)
        doc_ref = collection_ref.document()
        
        task_dict = task_data.model_dump()
        task_dict.pop('user_id', None)

        new_task = Task(id=doc_ref.id, user_id=user_id, **task_dict)
        
        await doc_ref.set(new_task.model_dump(exclude={'id'}))
        
        return new_task
