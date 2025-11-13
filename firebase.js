// Wweb app's Firebase configuration
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";


//----Question------ Is this safe - Will public see this?
const firebaseConfig = {
    apiKey: "AIzaSyA93kGndvJF7ur2I9DueMpqlNhjOWzl-b8",
    authDomain: "myfrontendauth1.firebaseapp.com",
    projectId: "myfrontendauth1",
    storageBucket: "myfrontendauth1.appspot.com",
    messagingSenderId: "568504315895",
    appId: "1:568504315895:web:1e7ddb91a27296d4e248f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

function setupLoginToggle() {
    const loginText = document.querySelector(".title-text .login");
    const loginForm = document.querySelector("form.login");
    const loginBtn = document.querySelector("label.login");
    const signupBtn = document.querySelector("label.signup");
    const signupLink = document.querySelector("form .signup-link a");

    // Only run if these elements exist (login page)
    if (loginText && loginForm && loginBtn && signupBtn) {
        signupBtn.addEventListener("click", () => {
            loginForm.style.marginLeft = "-50%";
            loginText.style.marginLeft = "-50%";
        });

        loginBtn.addEventListener("click", () => {
            loginForm.style.marginLeft = "0%";
            loginText.style.marginLeft = "0%";
        });
    }

    if (signupLink && signupBtn) {
        signupLink.addEventListener("click", (e) => {
            e.preventDefault();
            signupBtn.click(); // simulate clicking signup tab
        });
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutModal = document.getElementById("logoutModal");
    const confirmLogout = document.getElementById("confirmLogout");
    const cancelLogout = document.getElementById("cancelLogout");

    if (logoutBtn && logoutModal && confirmLogout && cancelLogout) {
        // Show modal when logout button is clicked
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logoutModal.style.display = "block";
        });

        // Confirm logout
        confirmLogout.addEventListener("click", async () => {
            try {
                await signOut(auth);
                console.log("User signed out");
                logoutModal.style.display = "none";
                window.location.href = "login.html"; // optional redirect
            } catch (error) {
                console.error("Sign-out error:", error);
            }
        });

        // Cancel logout
        cancelLogout.addEventListener("click", () => {
            logoutModal.style.display = "none";
        });
    }
}

// User already signed in check
function setupAuthLink() {
    const authLink = document.getElementById("authLink");
    if (!authLink) return;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is logged in → show email + logout
            authLink.innerText = `${user.email} (Logout)`;
            authLink.style.color = "green";

            authLink.onclick = async (e) => {
                e.preventDefault();
                const confirmLogout = confirm(`Sign out ${user.email}?`);
                if (confirmLogout) {
                    await signOut(auth);
                    console.log("User signed out");
                    window.location.href = "login.html"; // optional redirect
                }
            };
        } else {
            // User is logged out → show Login
            authLink.innerText = "Login";
            authLink.style.color = "white";

            authLink.onclick = (e) => {
                e.preventDefault();
                window.location.href = "login.html"; // go to login page
            };
        }
    });
}


// Sign-in handler
async function handleSignIn(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        console.log("Firebase response:", userCredential);
        document.getElementById("signinMessage").innerText = "Sign-in successful!";
        document.getElementById("signinMessage").style.color = "green";
        window.location.href = "index.html";
    } catch (error) {
        console.error("Sign-in error:", error);
        document.getElementById("signinMessage").innerText = error.message;
        document.getElementById("signinMessage").style.color = "red";
    }
}

// Register handler
async function handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById("registeremail").value;
    const pass = document.getElementById("registerpassword").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        console.log("Firebase response:", userCredential);
        document.getElementById("signinMessageR").innerText = "Account created successfully!";
        document.getElementById("signinMessageR").style.color = "pink";
        document.getElementById("registeremail").value = "";
        document.getElementById("registerpassword").value = "";
    } catch (error) {
        console.error("Registration error:", error);
        document.getElementById("signinMessageR").innerText = error.message;
        document.getElementById("signinMessageR").style.color = "red";
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    if (!email) {
        alert("Please enter your email above first.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent! Check your inbox.");
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// ============================== Attach form listeners ====================
// Setup login and register forms
function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleSignIn);
    }
}

// Setup register form
function setupRegisterForm() {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
}

// Setup post form
function setupPostForm() {
    const postForm = document.getElementById("postForm");
    if (postForm) {
        postForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const title = document.getElementById("post_header").value;
            const date = document.getElementById("post_date").value;
            const link = document.getElementById("post_link").value;
            const content = document.getElementById("post_content").value;
            const imageFile = document.getElementById("post_img").files[0];

            if (!imageFile) {
                document.getElementById("postMessage").innerText = "Please select an image.";
                return;
            }

            try {
                const imageRef = ref(storage, `media/${imageFile.name}`);
                await uploadBytes(imageRef, imageFile);
                const imageUrl = await getDownloadURL(imageRef);

                await addDoc(collection(db, "mediaPosts"), {
                    title,
                    date,
                    link,
                    content,
                    image: imageUrl,
                    createdAt: serverTimestamp()
                });

                document.getElementById("postMessage").innerText = "Post uploaded successfully!";
                postForm.reset();
            } catch (err) {
                console.error("Post error:", err);
                document.getElementById("postMessage").innerText = "Error uploading post.";
            }
        });
    }
}


// Attach form listeners after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    setupLoginForm();
    setupRegisterForm();
    setupPostForm();
    setupLoginToggle();
    setupAuthLink();
});

