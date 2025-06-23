// FILE: lms-frontend/src/app/page.tsx
// This file serves as the default entry point. For now, we'll redirect to the login.
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
}
