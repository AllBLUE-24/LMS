'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
                <i className="lni lni-apartment text-4xl text-zinc-800 mb-2"></i>
                <h1 className="text-2xl font-bold text-zinc-900">Welcome Back</h1>
                <p className="text-sm text-zinc-500">Log in to your LMS workspace.</p>
            </div>
            <Card className="p-8 border border-zinc-200 shadow-sm">
                <form onSubmit={handleLogin} className="space-y-6">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="space-y-2">
                         <label className="text-sm font-medium text-zinc-700">Email</label>
                        <Input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Logging In...' : 'Log In'}
                    </Button>
                </form>
            </Card>
            <p className="mt-6 text-center text-sm text-zinc-600">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-medium text-blue-600 hover:underline">
                    Sign up
                </Link>
            </p>
        </div>
    );
};
