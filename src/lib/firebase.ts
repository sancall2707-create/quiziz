import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

// ============================================================
//  Firebase configuration — merge env vars (VITE_FIREBASE_*) with
//  firebase-applet-config.json.  Env vars take precedence.
//  Project: codenusa-1c6ab
//  Database: Firebase Realtime Database (asia-southeast1)
// ============================================================
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || firebaseConfig.databaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

// Warn if config is incomplete
if (!config.apiKey) {
  console.error('FIREBASE CONFIG BELUM LENGKAP: VITE_FIREBASE_API_KEY diperlukan.');
}
if (!config.appId) {
  console.error('FIREBASE CONFIG BELUM LENGKAP: VITE_FIREBASE_APP_ID diperlukan.');
}

const app: FirebaseApp = !getApps().length ? initializeApp(config) : getApps()[0];

// Auth — Firebase Authentication
export const auth: Auth = getAuth(app);

// Realtime Database — primary data store (users, assignments, indexes)
export const database: Database = getDatabase(app);

// Storage — avatar uploads
export const storage: FirebaseStorage = getStorage(app);

// Functions — Cloud Functions (asia-southeast1)
export const functions: Functions = getFunctions(app, 'asia-southeast1');
