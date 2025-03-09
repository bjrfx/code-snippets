import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC-w9THFsmPDUI08mN2EZ4OhgtzFJi0x8Y",
  authDomain: "snippets-app-3c69d.firebaseapp.com",
  projectId: "snippets-app-3c69d",
  storageBucket: "snippets-app-3c69d.firebasestorage.app",
  messagingSenderId: "1092584260018",
  appId: "1:1092584260018:web:4d6fdca615fc31d592e4ab",
  measurementId: "G-RSCCGRP7YN"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Set persistence to LOCAL to persist auth state
setPersistence(auth, browserLocalPersistence);