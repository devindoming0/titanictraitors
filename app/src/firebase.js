import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyCxlskE_KQer_yw7sOa2YiRa-xqnAN_JRo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "traitors-a1884.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "traitors-a1884",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "traitors-a1884.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "282978069341",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:282978069341:web:276c58b5fca1ccde2516b4",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
