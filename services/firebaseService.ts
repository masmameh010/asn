
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy, 
    serverTimestamp, 
    writeBatch, 
    initializeFirestore, 
    persistentLocalCache,
    persistentSingleTabManager
} from 'firebase/firestore';
import { Collection } from '../types';

// IMPORTANT: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtwTZezlde_klGTybktv76cYmSvV9CiuE",
  authDomain: "penyimpan-prompt-asn.firebaseapp.com",
  projectId: "penyimpan-prompt-asn",
  storageBucket: "penyimpan-prompt-asn.firebasestorage.app",
  messagingSenderId: "369533423191",
  appId: "1:369533423191:web:dff66a2beaade29fc91d12",
  measurementId: "G-B5X32ER47K"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with modern offline persistence.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
});

const auth = getAuth(app);
const provider = new GoogleAuthProvider();


// --- Auth Functions ---
export const signInWithGoogle = async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Error during sign-in:", error);
        throw error;
    }
};

export const signOutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error during sign-out:", error);
    }
};

export { onAuthStateChanged, auth };

// --- Firestore Functions ---
const collectionsRef = collection(db, 'collections');

export const loadCollections = async (userId: string): Promise<Collection[]> => {
    const q = query(collectionsRef, where("userId", "==", userId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Collection));
};

export const addCollection = async (newCollection: Omit<Collection, 'id' | 'timestamp'>): Promise<Collection> => {
    const docData = {
        ...newCollection,
        timestamp: serverTimestamp()
    };
    const docRef = await addDoc(collectionsRef, docData);
    return {
        id: docRef.id,
        ...newCollection,
        timestamp: new Date()
    } as Collection;
};

export const batchAddCollections = async (userId: string, collectionsToAdd: Omit<Collection, 'id' | 'timestamp' | 'userId'>[]): Promise<void> => {
    const batch = writeBatch(db);
    
    collectionsToAdd.forEach(item => {
        const docRef = doc(collection(db, 'collections'));
        const docData = {
            ...item,
            userId: userId,
            timestamp: serverTimestamp()
        };
        batch.set(docRef, docData);
    });

    await batch.commit();
};


export const deleteCollection = async (id: string): Promise<void> => {
    const docRef = doc(db, 'collections', id);
    await deleteDoc(docRef);
};

export const clearAllCollections = async (userId: string): Promise<void> => {
    const q = query(collectionsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};
