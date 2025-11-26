import {
    signInUser,
    registerUser,
    resetPassword,
    logoutUser,
    watchAuthState,
    createPost,
    getAllPosts,
    getAllContacts25,
    getAllContacts21,
    getAllContacts21Pro,
    updatePost,
    deletePost,
    uploadImage,
    checkAdminLogin // New from firebase.js and used in showAdminFeatures 
} from "./firebase.js";

// ================ UI Toggles, Event Listeners, DOM ================
function setupLoginToggle() {
    const loginText = document.querySelector(".title-text .login");
    const loginForm = document.querySelector("form.login");
    const loginBtn = document.querySelector("label.login");
    const signupBtn = document.querySelector("label.signup");
    const signupLink = document.querySelector("form .signup-link a");

    if (!(loginText && loginForm && loginBtn && signupBtn)) return;

    signupBtn.addEventListener("click", () => {
        loginForm.style.marginLeft = "-50%";
        loginText.style.marginLeft = "-50%";
    });

    loginBtn.addEventListener("click", () => {
        loginForm.style.marginLeft = "0%";
        loginText.style.marginLeft = "0%";
    });

    if (signupLink) {
        signupLink.addEventListener("click", (e) => {
            e.preventDefault();
            signupBtn.click();
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
                await logoutUser();
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

const CLIENT_EMAIL = "newuser1@gmail.com";

function initAuthUI() {
    const authLink = document.getElementById("authLink");

    watchAuthState(async (user) => {
        if (user) {
            // Status text
            setText("loginStatus", "✅ Logged In", "green");

            // Auth link
            if (authLink) {
                authLink.innerText = `${user.email} (Logout)`;
                authLink.style.color = "green";
                authLink.onclick = async (e) => {
                    e.preventDefault();
                    const confirmLogout = confirm(`Sign out ${user.email}?`);
                    if (confirmLogout) {
                        await logoutUser();
                        window.location.href = "login.html";
                    }
                };
            }
        } else {
            // Status text
            setText("loginStatus", "❌ Not Logged In", "red");

            // Auth link
            if (authLink) {
                authLink.innerText = "Login";
                authLink.style.color = "white";
                authLink.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = "login.html";
                };
            }
        }

        // Toggle client-only features
        toggleAuthElements(user);
    });
}

function setText(id, text, color) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = text;
    if (color) el.style.color = color;
}

function toggleAuthElements(user) {
    const isClient = user && user.email === CLIENT_EMAIL;
    document.querySelectorAll('[data-auth="required"]').forEach(el => {
        el.classList.toggle("hidden", !isClient);
    });
}


// ================ Form Handling ================
function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleSignIn);
    }
}

function setupRegisterForm() {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
}

function setupPostForm() {
    const postForm = document.getElementById("postForm");
    if (!postForm) return;

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
            const imageUrl = await uploadImage(imageFile); // wrapper in firebase.js
            await createPost({title, date, link, content, image: imageUrl});

            document.getElementById("postMessage").innerText = "Post uploaded successfully!";
            postForm.reset();
        } catch (err) {
            console.error("Post error:", err);
            document.getElementById("postMessage").innerText = "Error uploading post.";
        }
    });
}

async function handleSignIn(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    try {
        const userCredential = await signInUser(email, pass);
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

async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById("registeremail").value;
    const pass = document.getElementById("registerpassword").value;

    try {
        const userCredential = await registerUser(email, pass);
        console.log("Firebase response:", userCredential);
        document.getElementById("signinMessageR").innerText = "Account created successfully!";
        document.getElementById("signinMessageR").style.color = "pink";
        document.getElementById("registerForm").reset();
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
        await resetPassword(email); // ✅ use wrapper correctly
        alert("Password reset email sent! Check your inbox.");
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// ================ Render/Load Media ================
function renderPost(postId, postData, user) {
    const container = document.getElementById("mediaContainer");
    const item = document.createElement("div");
    item.classList.add("media-item");
    item.dataset.id = postId;

    item.innerHTML = `
    <h3 class="media-title">${postData.title}</h3>
    <p>${postData.date}</p>
    <a href="${postData.link}" target="_blank">
      <img src="${postData.image}" alt="${postData.title}">
    </a>
    <p>${postData.description}</p>
    <div class="media-actions hidden" data-auth="required">
      <button class="pin-btn">Pin</button>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;
    container.appendChild(item);
    toggleAuthElements(user);
}

async function loadPosts(user) {
    try {
        const querySnapshot = await getAllPosts();
        querySnapshot.forEach((doc) => {
            renderPost(doc.id, doc.data(), user);
        });
    } catch (err) {
        console.error("Error loading posts:", err);
        const container = document.getElementById("mediaContainer");
        if (container) container.innerHTML = "<p>Failed to load posts.</p>";
    }
}

// ########### Rendering Contacts for the 3 contact groups ###########

function renderContact25(contactId, contactData, user) {
    const container = document.getElementById("contactContainer25");
    const item = document.createElement("div");
    item.classList.add("contact-item");
    item.dataset.id = contactId;
    
    item.innerHTML = `
    <h4 class="contact-name">${contactData.name}</h4>
    <p>${contactData.description}</p>
    <p><a href="${contactData.link}" target="_blank">${contactData.link}</a></p>
    <div class="contact-actions hidden" data-auth="required">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
    </div>
    `;

    container.appendChild(item);
    toggleAuthElements(user);
}

function renderContact21(contactId, contactData, user) {
    const container = document.getElementById("contactContainer21");
    const item = document.createElement("div");
    item.classList.add("contact-item");
    item.dataset.id = contactId;
    
    item.innerHTML = `
    <h4 class="contact-name">${contactData.name}</h4>
    <p>${contactData.description}</p>
    <p><a href="${contactData.link}" target="_blank">${contactData.link}</a></p>
    <div class="contact-actions hidden" data-auth="required">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
    </div>
    `;

    container.appendChild(item);
    toggleAuthElements(user);
}

function renderContact21Pro(contactId, contactData, user) {
    const container = document.getElementById("contactContainer21Pro");
    const item = document.createElement("div");
    item.classList.add("contact-item");
    item.dataset.id = contactId;
    
    item.innerHTML = `
    <h4 class="contact-name">${contactData.name}</h4>
    <p>${contactData.description}</p>
    <p><a href="${contactData.link}" target="_blank">${contactData.link}</a></p>
    <div class="contact-actions hidden" data-auth="required">
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
    </div>
    `;

    container.appendChild(item);
    toggleAuthElements(user);
}

// ########### Loading Contacts for the 3 contact groups ###########

async function loadContacts25(user) {
    try {
        const querySnapshot25 = await getAllContacts25();
        
        console.log("Contacts found:", querySnapshot25.size);
        querySnapshot25.forEach((doc) => {
            console.log("Contact doc:", doc.id, doc.data());
            renderContact25(doc.id, doc.data(), user);
        });
    } catch (err) {
        console.error("Error loading contacts:", err);
        const container = document.getElementById("contactContainer25");
        if (container) container.innerHTML = "<p>Failed to load contacts.</p>";
    }
}

async function loadContacts21(user) {
    try {
        const querySnapshot21 = await getAllContacts21();
        
        console.log("Contacts found:", querySnapshot21.size);
        querySnapshot21.forEach((doc) => {
            console.log("Contact doc:", doc.id, doc.data());
            renderContact21(doc.id, doc.data(), user);
        });
    } catch (err) {
        console.error("Error loading contacts:", err);
        const container = document.getElementById("contactContainer21");
        if (container) container.innerHTML = "<p>Failed to load contacts.</p>";
    }
}

async function loadContacts21Pro(user) {
    try {
        const querySnapshot21Pro = await getAllContacts21Pro();
        
        console.log("Contacts found:", querySnapshot21Pro.size);
        querySnapshot21Pro.forEach((doc) => {
            console.log("Contact doc:", doc.id, doc.data());
            renderContact21Pro(doc.id, doc.data(), user);
        });
    } catch (err) {
        console.error("Error loading contacts:", err);
        const container = document.getElementById("contactContainer21Pro");
        if (container) container.innerHTML = "<p>Failed to load contacts.</p>";
    }
}

// Ref: https://firebase.google.com/docs/auth/web/password-auth#web_3
async function showAdminFeatures() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    const auth = getAuth();

    if (email == CLIENT_EMAIL) {
        if (checkAdminLogin(auth, email, pass)) {
            console.log("Admin Signed In");
            // Add more here, such as displaying the buttons 
            contactEdit = document.getElementById("contact-actions hidden");
            adminInterface = document.getElementById("adminInterface");

            adminInterface.style.display = flex;
            contactEdit.style.display = flex;
        }
    }

}


// Single DOMContentLoaded block
document.addEventListener("DOMContentLoaded", () => {
    setupLoginForm();
    setupRegisterForm();
    setupPostForm();
    setupLoginToggle();
    setupLogoutButton();
    initAuthUI();
    showAdminFeatures();

    const forgotP = document.getElementById("forgotPassword");
    if (forgotP) forgotP.addEventListener("click", handleForgotPassword);

    const path = window.location.pathname;
    // Media page
    if (path.includes("media.html")) {
        watchAuthState((user) => {
            loadPosts(user);
        });
    }

    // Contact page
    if (path.includes("contact.html")) {
        watchAuthState((user) => {
            loadContacts25(user);
            loadContacts21(user);
            loadContacts21Pro(user);
        });
    }

    const btn = document.getElementById("currentProjectBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = "blog.html";
        });
    }
});

//  Single delegated click handler
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("mediaContainer");
    if (!container) return;

    container.addEventListener("click", async (e) => {
        const item = e.target.closest(".media-item");
        if (!item) return;
        const postId = item.dataset.id;

        if (e.target.classList.contains("delete-btn")) {
            try {
                await deletePost(postId);
                item.remove();
            } catch (err) {
                alert("You don’t have permission to delete this post.");
            }
        }

        if (e.target.classList.contains("edit-btn")) {
            console.log("Edit post:", postId);
            // TODO: open edit modal and call updatePost(postId, { ... })
        }

        if (e.target.classList.contains("pin-btn")) {
            try {
                await updatePost(postId, {pinned: true}); // ✅ wrapper
                alert("Post pinned!");
            } catch (err) {
                alert("You don’t have permission to pin this post.");
            }
        }
    });
});