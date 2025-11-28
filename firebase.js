import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    query,
    where,
    orderBy
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
export const ADMIN_EMAIL = "newuser1@gmail.com";

// =================== Auth Helpers ===================
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

// Optional admin login helper
export async function checkAdminLogin(authInstance, email, pass) {
    return await signInWithEmailAndPassword(authInstance, email, pass);
}

// =================== Firestore Helpers ===================
export async function createPost(data) {
    return await addDoc(collection(db, "mediaPosts"), {
        ...data,
        pinned: data.pinned ?? false,
        createdAt: serverTimestamp()
    });
}


export async function getAllPosts() {
    const q = query(
        collection(db, "mediaPosts"),
        orderBy("pinned", "desc"),
        orderBy("date", "desc")
    );
    return await getDocs(q);
}

export async function updatePost(postId, updates) {
    return await updateDoc(doc(db, "mediaPosts", postId), updates);
}

export async function deletePost(postId) {
    return await deleteDoc(doc(db, "mediaPosts", postId));
}

export async function togglePin(postId, currentlyPinned) {
    const postRef = doc(db, "mediaPosts", postId);
    const newPinned = !currentlyPinned;
    await updateDoc(postRef, { pinned: newPinned });
    return newPinned;
}

// Current blog posts

export async function createBlogPost(data) {
    return await addDoc(collection(db, "projectBlog2025"), {
        ...data,
        pinned: data.pinned ?? false,
        createdAt: serverTimestamp()
    });
}


export async function getAllBlogPosts() {
    const q = query(
        collection(db, "projectBlog2025"),
        orderBy("date", "desc")
    );
    return await getDocs(q);
}

export async function updateBlogPost(postId, updates) {
    return await updateDoc(doc(db, "projectBlog2025", postId), updates);
}

export async function deleteBlogPost(postId) {
    return await deleteDoc(doc(db, "projectBlog2025", postId));
}

export async function toggleBlogPin(postId, currentlyPinned) {
    const postRef = doc(db, "projectBlog2025", postId);
    const newPinned = !currentlyPinned;
    await updateDoc(postRef, { pinned: newPinned });
    return newPinned;
}
export async function saveUserInfo(uid, firstName, lastName, email) {
    try {
        await setDoc(doc(db, "userInfo", uid), {
            UID: uid,
            FirstName: firstName,
            LastName: lastName,
            Email: email
        });
        console.log("User info saved to Firestore");
    } catch (error) {
        console.error("Error saving user info:", error);
        throw error; 
    }
}
export async function getUserInfo(uid) {
    try {
        const userDocRef = doc(db, "userInfo", uid);
        const userSnap = await getDoc(userDocRef);

        console.log("User info retrieved");
        return userSnap; 
    } catch (error) {
        console.error("Error getting user info:", error);
        throw error;
    }
}
// Contact Functions

export async function getAllContacts25() {
    return await getDocs(collection(db, "contactInfo2025"));
}

export async function getAllContacts21() {
    return await getDocs(collection(db, "contactInfo2021_2022"));
}

export async function getAllContacts21Pro() {
    return await getDocs(collection(db, "contactInfo2021_Project"));
}

export async function addContact(data) {
    return await addDoc(collection(db, "contactInfo2025"), data);
}

export async function updateContact(contactId, data) {
    const contactRef = doc(db, "contactInfo2025", contactId);
    return await updateDoc(contactRef, data);
}

export async function deleteContact(contactId) {
    const contactRef = doc(db, "contactInfo2025", contactId);
    return await deleteDoc(contactRef);
}

// =================== Storage Helpers ===================
export async function uploadImage(file) {
    const imageRef = ref(storage, `media/${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
}
