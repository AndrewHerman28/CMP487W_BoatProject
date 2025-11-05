// Your web app's Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword,  signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
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

window.handleSignIn = async function(event) {
  event.preventDefault();
  //console.log("Function called");
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  //console.log("Attempting sign-in with:", email, pass);

  try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      console.log("Firebase response:", userCredential);
      document.getElementById("signinMessage").innerText = "Sign-in successful!";
      document.getElementById("signinMessage").style.color = "green";
      window.location.href="homepage.html"; // Redirects to admin page
  } catch (error) {
      console.error("Sign-in error:", error);
      document.getElementById("signinMessage").innerText = error.message;
      document.getElementById("signinMessage").style.color = "red";
  }
};
window.handleRegister = async function(event) {
  event.preventDefault();

  const email = document.getElementById("registeremail").value;
  const pass = document.getElementById("registerpassword").value;
  const auth = getAuth();

  try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      console.log("Firebase response:", userCredential);
      document.getElementById("signinMessageR").innerText = "Account created successfully!";
      document.getElementById("signinMessageR").style.color = "pink";
      document.getElementById('registeremail').value="";
      document.getElementById('registerpassword').value="";
  } catch (error) {
      console.error("Registration error:", error);
      document.getElementById("signinMessageR").innerText = error.message;
      document.getElementById("signinMessageR").style.color = "red";
  }
};
