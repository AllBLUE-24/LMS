// FILE: src/app/(auth)/register/page.tsx

'use client';

import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Import setDoc
import { auth, db } from '@/lib/firebase'; // Import db
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            // 1. Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update their Auth profile with their name
            await updateProfile(user, { displayName: name });

            // 3. **THE DEFINITIVE FIX:** Create the user's profile document in Firestore
            // This links their Auth account to their data in our application.
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: user.email,
                capabilities: [], // New users start with no special capabilities
                organizationId: "default_org" // This would be dynamic in a real multi-tenant app
            });

            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
                <i className="lni lni-apartment text-4xl text-zinc-800 mb-2"></i>
                <h1 className="text-2xl font-bold text-zinc-900">Create an Account</h1>
                <p className="text-sm text-zinc-500">Start managing your leads effectively.</p>
            </div>
            <Card className="p-8 border border-zinc-200 shadow-sm">
                <form onSubmit={handleRegister} className="space-y-6">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                     <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="Must be at least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>
            </Card>
            <p className="mt-6 text-center text-sm text-zinc-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:underline">
                    Log in
                </Link>
            </p>
        </div>
    );
};