"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { initializeApp, FirebaseApp } from 'firebase/app';
// --- MODIFIED: Imported signOut ---
import { getAuth, signOut, onAuthStateChanged, User as FirebaseUser, Auth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, Firestore } from 'firebase/firestore';
import { LayoutDashboard } from 'lucide-react';

// Declare global variables provided by the Canvas environment
// --- Firebase Initialization ---
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase API Key is missing. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in your environment variables.");
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

} catch (e) {
    console.error("Failed to initialize Firebase:", e);
    throw e;
}

// --- CONTEXT DEFINITION ---
interface AuthContextType {
  user: FirebaseUser | null;
  lmsUser: any | null;
  loadingAuth: boolean;
  db: Firestore;
  auth: Auth;
  
  // --- ADDED: logout property ---
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- CUSTOM HOOK ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider.");
    }
    return context;
};

// --- AUTHENTICATION PROVIDER ---
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [lmsUser, setLmsUser] = useState<any | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const logout = useCallback(async () => {
        console.log("Logging out...");
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }, [router]);

    useEffect(() => {
        let unsubscribeFirestore: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
            setLoadingAuth(true);

            if (firebaseUser) {
                setUser(firebaseUser);
                firebaseUser.getIdTokenResult(true).then(tokenResult => {
                    const tenantId = tokenResult.claims.tenantId as string | undefined;
                    if (tenantId) {
                        const userDocRef = doc(db, `tenants/${tenantId}/users`, firebaseUser.uid);
                        unsubscribeFirestore = onSnapshot(userDocRef, (docSnapshot) => {
                            if (docSnapshot.exists()) {
                                const firestoreData = docSnapshot.data();
                                const finalUserObject = {
                                    id: docSnapshot.id,
                                    name: firestoreData.name,
                                    email: firestoreData.email,
                                    capabilities: firestoreData.capabilities,
                                    tenantId: tenantId,
                                };
                                setLmsUser(finalUserObject);
                            } else {
                                setLmsUser(null);
                            }
                            setLoadingAuth(false);
                        }, (error) => {
                            console.error("AuthContext: Firestore snapshot error:", error);
                            setLmsUser(null);
                            setLoadingAuth(false);
                        });
                    } else {
                        console.error("AuthContext: No tenantId found in user's custom claims.");
                        setLmsUser(null);
                        setLoadingAuth(false);
                    }
                }).catch(error => {
                    console.error("AuthContext: Error getting user ID token:", error);
                    setLmsUser(null);
                    setLoadingAuth(false);
                });
            } else {
                setUser(null);
                setLmsUser(null);
                setLoadingAuth(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
        };
    }, []);

    const isPublicPage = ['/login', '/register'].includes(pathname);

    useEffect(() => {
        if (loadingAuth) {
            return; // Wait until the authentication process is complete.
        }

        const userIsLoggedIn = !!user;

        // Redirect a logged-in user from a public page to the dashboard.
        if (userIsLoggedIn && isPublicPage) {
            router.push('/');
            return;
        }

        // Redirect a logged-out user from a protected page to the login page.
        if (!userIsLoggedIn && !isPublicPage) {
            router.push('/login');
            return;
        }
    }, [loadingAuth, user, isPublicPage, router]);

    if (loadingAuth || (!user && !isPublicPage)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <LayoutDashboard className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, lmsUser, loadingAuth, db, auth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export { db, auth };
