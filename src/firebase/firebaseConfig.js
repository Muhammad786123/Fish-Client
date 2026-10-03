import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "royal-n-trading-system.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "royal-n-trading-system",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "royal-n-trading-system.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
} catch (e) {
  db = getFirestore(app);
}

// Initialize Storage
let storage;
try {
  storage = getStorage(app);
} catch (e) {
  if (import.meta.env.DEV) {
    console.warn("Storage initialization warning:", e);
  }
}

// Enable IndexedDB Persistence with fallback handling for multi-tab and unsupported environments
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (import.meta.env.DEV) {
      if (err.code === "failed-precondition") {
        console.warn("Persistence skipped: Multiple tabs open concurrently.");
      } else if (err.code === "unimplemented") {
        console.warn("Persistence unsupported by browser.");
      }
    }
  });
} catch (err) {
  // Persistence already enabled or handled by SDK
}

export { app, db, storage };
