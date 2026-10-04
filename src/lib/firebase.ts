import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBvdRO5QBHP0BJ59F5LPDsbKH5kauT-L_0",
  authDomain: "ai-studio-applet-webapp-17af3.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-17af3",
  storageBucket: "ai-studio-applet-webapp-17af3.firebasestorage.app",
  messagingSenderId: "1029961024458",
  appId: "1:1029961024458:web:aad1cee16d739a37268533"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let db: ReturnType<typeof getFirestore>;
if (typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(app);
  }
} else {
  db = getFirestore(app);
}

const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
