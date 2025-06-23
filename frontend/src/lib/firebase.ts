// FILE: lms-frontend/src/lib/firebase.ts
// Client-side Firebase initialization and exports.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- START DEBUGGING LOGS ---
console.log('Firebase Config being loaded:');
console.log('API Key:', firebaseConfig.apiKey ? 'Loaded' : 'UNDEFINED/EMPTY');
console.log('Auth Domain:', firebaseConfig.authDomain ? 'Loaded' : 'UNDEFINED/EMPTY');
console.log('Project ID:', firebaseConfig.projectId ? 'Loaded' : 'UNDEFINED/EMPTY');
console.log('Storage Bucket:', firebaseConfig.storageBucket ? 'Loaded' : 'UNDEFINED/EMPTY');
console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId ? 'Loaded' : 'UNDEFINED/EMPTY');
console.log('App ID:', firebaseConfig.appId ? 'Loaded' : 'UNDEFINED/EMPTY');
console.log('Full firebaseConfig object:', firebaseConfig);
// --- END DEBUGGING LOGS ---

// Initialize Firebase for the client if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app); // Get the Authentication instance
const db = getFirestore(app); // Get the Firestore instance

export { app, auth, db };
