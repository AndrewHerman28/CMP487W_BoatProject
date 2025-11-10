
 const loginText = document.querySelector(".title-text .login");
      const loginForm = document.querySelector("form.login");
      const loginBtn = document.querySelector("label.login");
      const signupBtn = document.querySelector("label.signup");
      const signupLink = document.querySelector("form .signup-link a");
      signupBtn.onclick = (()=>{
        loginForm.style.marginLeft = "-50%";
        loginText.style.marginLeft = "-50%";
      });
      loginBtn.onclick = (()=>{
        loginForm.style.marginLeft = "0%";
        loginText.style.marginLeft = "0%";
      });
      signupLink.onclick = (()=>{
        signupBtn.click();
        return false;
      });


// Your web app's Firebase configuration
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
  import { getAuth,onAuthStateChanged, createUserWithEmailAndPassword,  signInWithEmailAndPassword, sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
  //----Question------ Is this safe - Will public see this?
 const firebaseConfig = {
  apiKey: "AIzaSyA93kGndvJF7ur2I9DueMpqlNhjOWzl-b8",
  authDomain: "myfrontendauth1.firebaseapp.com",
  projectId: "myfrontendauth1",
  storageBucket: "myfrontendauth1.firebasestorage.app",
  messagingSenderId: "568504315895",
  appId: "1:568504315895:web:1e7ddb91a27296d4e248f2"
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

// Attach form listeners after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const forgotP = document.getElementById("forgotPassword"); 

    if (loginForm) {
        loginForm.addEventListener("submit", handleSignIn);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
    if (forgotP) forgotP.addEventListener("click", handleForgotPassword);

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
