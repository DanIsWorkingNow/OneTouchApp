
// src/constants/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdJTkuaMvyLHu_rt9JGK6XQoPOqPb9rUo",
  authDomain: "onetouchapp-1684e.firebaseapp.com",
  projectId: "onetouchapp-1684e",
  storageBucket: "onetouchapp-1684e.firebasestorage.app",
  messagingSenderId: "227825118007",
  appId: "1:227825118007:web:bf36019de339b1a71888b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;



