from . import students, courses

all_routers = [
    {
        "router": students.router,
        "prefix": "/api/v1/education",
        "tags": ["Education - Students"],
    },
    {
        "router": courses.router,
        "prefix": "/api/v1/education",
        "tags": ["Education - Courses"],
    },
]
