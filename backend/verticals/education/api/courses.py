# FILE: backend/verticals/education/api/courses.py
from fastapi import APIRouter, status

router = APIRouter()

@router.post("/courses", status_code=status.HTTP_201_CREATED)
async def create_course():
    """
    (Stub) Creates a new course.
    """
    return {"message": "Course created successfully."}

@router.get("/courses")
async def get_courses():
    """
    (Stub) Retrieves a list of all courses.
    """
    # In a real implementation, this would fetch data from a repository.
    return [
        {"id": "C001", "name": "Bachelor of Science in Computer Science", "duration_months": 36},
        {"id": "C002", "name": "Master of Business Administration", "duration_months": 24},
    ]

@router.get("/courses/{course_id}")
async def get_course(course_id: str):
    """
    (Stub) Retrieves details for a specific course.
    """
    return {"id": course_id, "name": "Sample Course", "duration_months": 12}

@router.put("/courses/{course_id}")
async def update_course(course_id: str):
    """
    (Stub) Updates a course.
    """
    return {"message": f"Course {course_id} updated successfully."}

@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(course_id: str):
    """
    (Stub) Deletes a course.
    """
    return
