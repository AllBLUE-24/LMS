from fastapi import APIRouter

router = APIRouter()

@router.get("/students")
async def get_students():
    """
    A sample endpoint to retrieve a list of students.
    """
    return {"message": "This endpoint will return a list of students."}
