import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2WwOP-EvWZj7qSvuw0JZXCa2kDSyUQPI",
  authDomain: "planner-b45c1.firebaseapp.com",
  projectId: "planner-b45c1",
  storageBucket: "planner-b45c1.firebasestorage.app",
  messagingSenderId: "727226324027",
  appId: "1:727226324027:web:7caaa7aac8e4c816d6f81e",
  measurementId: "G-9DTY9N7M0B",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
