// FILE: lms-frontend/src/app/(auth)/layout.tsx
// This layout specifically styles the authentication pages (login, register)
// to be centered on the screen, typically without a sidebar or extensive header.

import React from 'react';

export default function AuthLayout({
  children, // This will be the login or registration page content
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 sm:p-10 border border-neutral-200">
        {/* Placeholder for a logo or brand name */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-700">LMS</h1>
          <p className="text-sm text-neutral-500">Lead Management System</p>
        </div>
        {children} {/* Renders the actual login or register page content */}
      </div>
    </div>
  );
}
