import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
// Fail fast with a clearer message if env vars are missing
const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
if (missing.length) {
    throw new Error(`Faltan variables de entorno Firebase en .env.local: ${missing.join(", ")}`);
}
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
/**
 * Shared Firebase Auth instance for the frontend.
 */
export const auth = getAuth(app);
