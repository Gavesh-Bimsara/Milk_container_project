// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAZd82KkF8RSzWLvrN1L5yz4msuD76XRpU",
  authDomain: "temp-app-a3984.firebaseapp.com",
  projectId: "temp-app-a3984",
  storageBucket: "temp-app-a3984.firebasestorage.app",
  messagingSenderId: "939824244381",
  appId: "1:939824244381:android:958deb2621039f27091674",
};

const app = initializeApp(firebaseConfig);

// ✅ Auth with persistent storage (stays logged in)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

console.log("🔥 Firebase connected:", firebaseConfig.projectId);