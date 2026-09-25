import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const cfg = firebaseConfig as any;
export const db = cfg.firestoreDatabaseId 
  ? getFirestore(app, cfg.firestoreDatabaseId)
  : getFirestore(app);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection is operating in offline mode or awaiting Cloud Firestore API activation.');
    } else {
      console.warn('Firebase status:', error);
    }
  }
}

// Automatically verify connection on initialization
testConnection();

export { app };
