import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDE7R28VOaxMCTFjw-dJwt1eJ_HSCz4PNw",
  authDomain: "expensescan-ai-20cbf.firebaseapp.com",
  projectId: "expensescan-ai-20cbf",
  storageBucket: "expensescan-ai-20cbf.firebasestorage.app",
  messagingSenderId: "155448389965",
  appId: "1:155448389965:web:baaa627a8a23ca5683c704",
  measurementId: "G-E95RME5095"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const SHEETS_COL = 'expense_sheets';

/**
 * Save a sheet to Firestore. Returns the document ID (used as share link key).
 */
export const saveSheetToFirestore = async (sheet) => {
  const id  = sheet.id || `scan-${Date.now()}`;
  const ref = doc(db, SHEETS_COL, id);
  await setDoc(ref, {
    ...sheet,
    id,
    savedAt: serverTimestamp(),
  });
  return id;
};

/**
 * Load all sheets from Firestore, ordered by most recent.
 */
export const loadAllSheetsFromFirestore = async () => {
  const q       = query(collection(db, SHEETS_COL), orderBy('timestamp', 'desc'));
  const snap    = await getDocs(q);
  return snap.docs.map(d => d.data());
};

/**
 * Load a single sheet by ID (for share links).
 */
export const getSheetById = async (id) => {
  const ref  = doc(db, SHEETS_COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Sheet not found');
  return snap.data();
};

/**
 * Delete a sheet from Firestore.
 */
export const deleteSheetFromFirestore = async (id) => {
  await deleteDoc(doc(db, SHEETS_COL, id));
};
