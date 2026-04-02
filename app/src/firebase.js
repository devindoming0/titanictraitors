import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCxlskE_KQer_yw7sOa2YiRa-xqnAN_JRo",
  authDomain: "traitors-a1884.firebaseapp.com",
  projectId: "traitors-a1884",
  storageBucket: "traitors-a1884.firebasestorage.app",
  messagingSenderId: "282978069341",
  appId: "1:282978069341:web:276c58b5fca1ccde2516b4",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
