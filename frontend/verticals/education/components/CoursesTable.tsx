// FILE: frontend/verticals/education/components/CoursesTable.tsx
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// --- TYPE Definitions ---
interface Course {
    id: string;
    name: string;
    duration_months: number;
}

export const CoursesTable = ({ courses }: { courses: Course[] }) => {
    return (
        <Card>
             <div className="p-4 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Courses</h3>
                    <p className="text-sm text-muted-foreground">A list of all courses offered.</p>
                </div>
                <Button variant="default" size="sm">Add Course</Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted">
                        <tr>
                            <th className="px-6 py-3">Course Name</th>
                            <th className="px-6 py-3">Duration (Months)</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.length > 0 ? (
                            courses.map(course => (
                                <tr key={course.id} className="bg-background hover:bg-muted">
                                    <td className="px-6 py-4 font-medium text-foreground">{course.name}</td>
                                    <td className="px-6 py-4">{course.duration_months}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-muted-foreground">No courses found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
