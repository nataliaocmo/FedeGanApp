import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDxwYiFq3zjqW4chGytINSJyxIlrLHj9GM",
    authDomain: "fedeganapp-4a3c6.firebaseapp.com",
    projectId: "fedeganapp-4a3c6",
    storageBucket: "fedeganapp-4a3c6.firebasestorage.app",
    messagingSenderId: "450982734560",
    appId: "1:450982734560:web:39513b33d864fe5e54be85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);