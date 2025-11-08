// Your web app's Firebase configuration
import {initializeApp} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const firebaseConfig = {
    
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


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

// Attach form listeners after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleSignIn);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }

    // Detect if user is already signed in
    onAuthStateChanged(auth, (user) => {
        const justSignedIn = localStorage.getItem("justSignedIn");

        if (user && justSignedIn === "true") {
            localStorage.removeItem("justSignedIn");
            window.location.href = "index.html";
        } else if (user) {
            console.log("User already signed in:", user.email);
        }
    });
});
