import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp, getDoc, runTransaction, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBVN3kI1JhY4bqK09u63MsjcUOHlrHgszk",
    authDomain: "jaipuria-pay-60de8.firebaseapp.com",
    projectId: "jaipuria-pay-60de8",
    storageBucket: "jaipuria-pay-60de8.firebasestorage.app",
    messagingSenderId: "398572686952",
    appId: "1:398572686952:web:f08aa5dcaa92bbbf9035dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously immediately
signInAnonymously(auth).catch((error) => {
    console.error("Anonymous Auth Failed", error);
});

export { db, auth, collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, doc, serverTimestamp, getDoc, onAuthStateChanged, runTransaction, setDoc };
