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
const db = getFirestore(app);
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

// --- Storage Helpers ---
export async function uploadImage(file) {
    const imageRef = ref(storage, `media/${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
}

// Display Contact Information
// Bug: doesn't display on contact.html
export async function displayContactInfo() {
    const dataArea = document.getElementById("contact-info");

    const contacts2021_2022 = await getDocs(collection(db, "contactInfo2021_2022"));
    const contacts2021_Project = await getDocs(collection(db, "contactInfo2021_Project"));
    const contacts2025 = await getDocs(collection(db, "contactInfo2025"));
    let display = '';

    contacts2025.forEach((doc) => {
        const data = doc.data();
        if (data.name && data.link) {
            display += `
                <div>
                    <p>${data.name}<p>
                    <p>${data.link}</p>
                    <p>-----</p>
                </div>`;
        }
        else if (!data.link) {
            display += `
            <div>
                <p>${data.name}<p>
                <p>-----</p>
            </div>`;
        }
        });

    contacts2021_2022.forEach((doc) => {
        const data = doc.data();
        if (data.name && data.link) {
            display += `
                <div>
                    <p>${data.name}<p>
                    <p>${data.link}</p>
                    <p>-----</p>
                </div>`;
        }
        else if (!data.link) {
            display += `
            <div>
                <p>${data.name}<p>
                <p>-----</p>
            </div>`;
        }
        });

    contacts2021_Project.forEach((doc) => {
        const data = doc.data();
        if (data.name && data.link && data.description) {
            display += `
                <div>
                    <p>${data.name}<p>
                    <p>${data.link}</p>
                    <p>${data.description}</p>
                    <p>-----</p>
                </div>`;
        }
        else if (!data.link && !data.description) {
            display += `
            <div>
                <p>${data.name}<p>
            </div>`;
        }
        else if (!data.link && data.description) {
            display += `
            <div>
                <p>${data.name}<p>
                <p>${data.description}<p>
            </div>`;
        }
        else if (data.link && !data.description) {
            display += `
            <div>
                <p>${data.name}<p>
                <p>${data.link}<p>
            </div>`;
        }
        });


    dataArea.innerHTML = display;
}