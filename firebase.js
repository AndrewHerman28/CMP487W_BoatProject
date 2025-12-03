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
    setDoc,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot
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

export const ADMIN_EMAILS = [
    "newuser1@gmail.com",
    "ajh7353@psu.edu",
    "hjt106@psu.edu"
];

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

// Admin login helper (flexible + error handling)
export async function checkAdminLogin(authInstance = auth, email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
        return userCredential.user;
    } catch (err) {
        console.error("Admin login failed:", err);
        throw err;
    }
}

// =================== Firestore Helpers ===================

// ----- Media Posts -----
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
    await updateDoc(postRef, {pinned: newPinned});
    return newPinned;
}

export async function addMediaPost(data) {
    return await addDoc(collection(db, "mediaPosts"), {
        ...data,
        createdAt: serverTimestamp()
    });
}

// ----- Blog Posts -----
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
    await updateDoc(postRef, {pinned: newPinned});
    return newPinned;
}

// ----- User Info -----
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

// =================== Comments ===================
export async function addComment(postId, user, text, parentId = null) {
    const localPart = user.email.split("@")[0];
    return await addDoc(collection(db, "posts", postId, "comments"), {
        authorId: user.uid,
        authorName: user.displayName || localPart,
        text,
        timestamp: serverTimestamp(),
        parentId,
        deleted: false
    });
}

export function listenToComments(postId, callback) {
    const q = query(
        collection(db, "posts", postId, "comments"),
        orderBy("timestamp", "asc")
    );
    return onSnapshot(q, callback);
}


export async function deleteComment(postId, commentId) {
    const commentsRef = collection(db, "posts", postId, "comments");

    // Get all comments
    const snapshot = await getDocs(commentsRef);

    // Build a map of comments
    const comments = {};
    snapshot.forEach(docSnap => {
        comments[docSnap.id] = {id: docSnap.id, ...docSnap.data()};
    });

    // Recursive delete function
    async function deleteRecursively(id) {
        // Delete this comment
        await deleteDoc(doc(db, "posts", postId, "comments", id));

        // Find children
        Object.values(comments).forEach(c => {
            if (c.parentId === id) {
                deleteRecursively(c.id);
            }
        });
    }

    // Kick off recursive deletion
    await deleteRecursively(commentId);
}


export async function cleanupDeletedComments(postId) {
    const commentsRef = collection(db, "posts", postId, "comments");
    const snapshot = await getDocs(commentsRef);

    const comments = {};
    snapshot.forEach(docSnap => {
        comments[docSnap.id] = {id: docSnap.id, ...docSnap.data()};
    });

    const hasChildren = new Set();
    Object.values(comments).forEach(c => {
        if (c.parentId) hasChildren.add(c.parentId);
    });

    for (const c of Object.values(comments)) {
        if (c.deleted && !hasChildren.has(c.id)) {
            await deleteDoc(doc(db, "posts", postId, "comments", c.id));
            console.log("Deleted orphaned comment:", c.id);
        }
    }
}

// =================== Contacts ===================
export async function getAllContacts25() {
    return await getDocs(collection(db, "contactInfo2025"));
}

export async function getAllContacts21() {
    return await getDocs(collection(db, "contactInfo2021_2022"));
}

export async function getAllContacts21Pro() {
    return await getDocs(collection(db, "contactInfo2021_Project"));
}

// Add contact (default to 2025 collection)
export async function addContact(data) {
    return await addDoc(collection(db, "contactInfo2025"), {
        ...data
    });
}

// Update contact (default to 2025 collection)
export async function updateContact(contactId, data) {
    const contactRef = doc(db, "contactInfo2025", contactId);
    return await updateDoc(contactRef, data);
}

// Delete contact (default to 2025 collection)
export async function deleteContact(contactId) {
    const contactRef = doc(db, "contactInfo2025", contactId);
    return await deleteDoc(contactRef);
}

// Flexible loader by collection
export async function loadContactsByCollection(user, collectionName) {
    return loadContacts(
        user,
        () => getDocs(collection(db, collectionName)),
        collectionName
    );
}

// Flexible update/delete by collection
export async function updateContactByCollection(contactId, data, collectionName) {
    const contactRef = doc(db, collectionName, contactId);
    return await updateDoc(contactRef, data);
}

export async function deleteContactByCollection(contactId, collectionName) {
    const contactRef = doc(db, collectionName, contactId);
    return await deleteDoc(contactRef);
}


// =================== Storage Helpers ===================
export async function uploadImage(file, path = "media") {
    try {
        const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
        const fileRef = ref(storage, `${path}/${uniqueName}`);

        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        return url;
    } catch (err) {
        console.error("Image upload failed:", err);
        throw err;
    }
}
