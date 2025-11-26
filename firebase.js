
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    validatePassword, // Could be used during the checkAdminLogin function, unsure how yet
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyA93kGndvJF7ur2I9DueMpqlNhjOWzl-b8",
    authDomain: "myfrontendauth1.firebaseapp.com",
    projectId: "myfrontendauth1",
    storageBucket: "myfrontendauth1.appspot.com",
    messagingSenderId: "568504315895",
    appId: "1:568504315895:web:1e7ddb91a27296d4e248f2"
};

// --- Init ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- Auth Helpers ---
export async function signInUser(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
}

export async function registerUser(email, password) {
    return await createUserWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email) {
    return await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
    return await signOut(auth);
}

export function watchAuthState(callback) {
    return onAuthStateChanged(auth, callback);
}

// Ref: https://firebase.google.com/docs/auth/web/password-auth#web_3
export async function checkAdminLogin(auth, email, pass) {
    return await signInWithEmailAndPassword(auth, email, pass);
}

// --- Firestore Helpers ---
export async function createPost(data) {
    return await addDoc(collection(db, "mediaPosts"), {
        ...data,
        createdAt: serverTimestamp()
    });
}

export async function getAllPosts() {
    return await getDocs(collection(db, "mediaPosts"));
}

export async function updatePost(postId, updates) {
    return await updateDoc(doc(db, "mediaPosts", postId), updates);
}

export async function deletePost(postId) {
    return await deleteDoc(doc(db, "mediaPosts", postId));
}

export async function getAllContacts25() {
    return await getDocs(collection(db, "contactInfo2025"));
}

export async function getAllContacts21() {
    return await getDocs(collection(db, "contactInfo2021_2022"));
}

export async function getAllContacts21Pro() {
    return await getDocs(collection(db, "contactInfo2021_Project"));
}

// --- Storage Helpers ---
export async function uploadImage(file) {
    const imageRef = ref(storage, `media/${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
}