import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC2x67g3-vOvcPtRQqK5Nln4Er_CD26Ytc",
  authDomain: "moneymap-app-4da40.firebaseapp.com",
  projectId: "moneymap-app-4da40",
  storageBucket: "moneymap-app-4da40.firebasestorage.app",
  messagingSenderId: "273747664106",
  appId: "1:273747664106:web:40f852da95597ad06a4b93"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;