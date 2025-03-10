// Script to make a user an admin in Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

// Firebase configuration from the project
const firebaseConfig = {
  apiKey: "AIzaSyC-w9THFsmPDUI08mN2EZ4OhgtzFJi0x8Y",
  authDomain: "snippets-app-3c69d.firebaseapp.com",
  projectId: "snippets-app-3c69d",
  storageBucket: "snippets-app-3c69d.firebasestorage.app",
  messagingSenderId: "1092584260018",
  appId: "1:1092584260018:web:4d6fdca615fc31d592e4ab",
  measurementId: "G-RSCCGRP7YN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// User ID to update
const userId = 'sQ7F1dd95Mhnhbli1c23snzpsfL2';

async function makeUserAdmin() {
  try {
    // Get reference to the user document
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('Current user data:', userSnap.data());
      
      // Update the user to make them an admin
      await updateDoc(userRef, {
        isAdmin: true
      });
      
      console.log(`User ${userId} has been successfully made an admin.`);
      
      // Verify the update
      const updatedUserSnap = await getDoc(userRef);
      console.log('Updated user data:', updatedUserSnap.data());
    } else {
      console.log(`User ${userId} does not exist in the database.`);
    }
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Exit the process after a short delay to ensure Firebase operations complete
    setTimeout(() => process.exit(0), 2000);
  }
}

// Execute the function
makeUserAdmin();