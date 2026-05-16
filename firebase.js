// Importamos Firebase directamente desde su CDN oficial para la web
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";

// Importamos Firestore desde el mismo CDN
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDifPO2hBUo3PEOVnFygUeVk47J8BE-Tjk",
  authDomain: "animales-2b9a2.firebaseapp.com",
  projectId: "animales-2b9a2",
  storageBucket: "animales-2b9a2.firebasestorage.app",
  messagingSenderId: "291985164512",
  appId: "1:291985164512:web:22259511bb47b922926885"
};

// Inicializamos Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportamos 'db' y las funciones
export { db, collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc };