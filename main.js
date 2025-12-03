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
    loadContactsByCollection,
    getUserInfo,
    saveUserInfo,
    updateContact,
    deleteContact,
    deleteBlogPost,
    updateBlogPost,
    togglePin,
    updatePost,
    deletePost,
    uploadImage,
    checkAdminLogin,
    auth,
    ADMIN_EMAIL,
    getAllBlogPosts,
} from "./firebase.js";

import {
    addDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

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
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logoutModal.style.display = "block";
        });

        confirmLogout.addEventListener("click", async () => {
            try {
                await logoutUser();
                console.log("User signed out");
                logoutModal.style.display = "none";
                window.location.href = "login.html";
            } catch (error) {
                console.error("Sign-out error:", error);
            }
        });

        cancelLogout.addEventListener("click", () => {
            logoutModal.style.display = "none";
        });
    }
}

function initAuthUI() {
    const authLink = document.getElementById("authLink");

    watchAuthState(async (user) => {
        if (user) {
            setText("loginStatus", "✅ Logged In", "green");
            let firstName;
            if (authLink) {
                const userSnap = await getUserInfo(user.uid);
                if (userSnap.exists()) {
                    firstName = userSnap.data().FirstName;
                } else {
                    firstName = user.email; // fallback
                }
                authLink.innerText = `Hello ${firstName} (Logout)`;
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
            setText("loginStatus", "❌ Not Logged In", "red");
            if (authLink) {
                authLink.innerText = "Login";
                authLink.style.color = "white";
                authLink.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = "login.html";
                };
            }
        }
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
    const isAdmin = user && user.email === ADMIN_EMAIL;

    // Admin-only features
    document.querySelectorAll('[data-auth="admin"]').forEach(el => {
        el.classList.toggle("hidden", !isAdmin);
    });

    // Client-only features (edit/delete/pin buttons)
    document.querySelectorAll('[data-auth="required"]').forEach(el => {
        el.classList.toggle("hidden", !isAdmin);
    });
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ================ Form Handling ================
function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) loginForm.addEventListener("submit", handleSignIn);
}

function setupRegisterForm() {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) registerForm.addEventListener("submit", handleRegister);
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
            const imageUrl = await uploadImage(imageFile);
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
    const fName = document.getElementById("registerFirstNameId").value;
    const lName = document.getElementById("registerLastNameId").value;

    try {
        const userCredential = await registerUser(email, pass);
        const uid = userCredential.user.uid;

        await saveUserInfo(uid, fName, lName, email);

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
        await resetPassword(email);
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

    if (postData.pinned) item.dataset.pinned = "true";

    item.innerHTML = `
      <div class="media-actions hidden" data-auth="required">
        <button class="pin-btn">📌</button>
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
    </div>


      <h3 class="media-title">${postData.title}</h3>
      <p class="media-date">${postData.date}</p>
      <a href="${postData.link}" target="_blank">
        <img src="${postData.image}" alt="${postData.title}">
      </a>
      <p class="media-description">${postData.description}</p>
    `;

    container.appendChild(item);

    const pinBtn = item.querySelector(".pin-btn");
    pinBtn.addEventListener("click", async () => {
        const currentlyPinned = item.dataset.pinned === "true";
        const newPinned = await togglePin(postId, currentlyPinned);

        postData.pinned = newPinned;
        item.dataset.pinned = newPinned ? "true" : "false";

        // Re-sort DOM
        container.removeChild(item);
        if (newPinned) {
            container.insertBefore(item, container.firstChild);
        } else {
            container.appendChild(item);
        }

        showToast(`Post "${postData.title}" ${newPinned ? "pinned" : "unpinned"}!`);
    });
    const editBtn = item.querySelector(".edit-btn");
        let isEditing = false;
        editBtn.addEventListener("click", async () => {
    if (!isEditing) {
        // ================= ENTER EDIT MODE =================
        isEditing = true;
        editBtn.textContent = "✅"; // Show save icon
        // Get elements
        const titleEl = item.querySelector(".media-title");
        const dateEl = item.querySelector(".media-date");
        const descEl = item.querySelector(".media-description");
        const linkEl = item.querySelector("a");
        //linkEl.addEventListener("click", (e) => e.preventDefault()) // because above the it supposed open new tab if clicked on picture 
         // Convert title to <input>
        titleEl.outerHTML = `
            <input id="edit-title-${postId}" class="edit-input" value="${postData.title}">
        `;

        // Convert date to <input type="date">
        dateEl.outerHTML = `
        <input id="edit-date-${postId}" class="edit-input" value="${postData.date}">
        `;

        // Convert description to <textarea>
        descEl.outerHTML = `
            <textarea id="edit-description-${postId}" class="edit-textarea">${postData.description}</textarea>
        `;
        linkEl.outerHTML = `
        <textarea id="edit-link-${postId}" class="edit-input">${postData.link}</textarea>
        `;

        // Remove existing <figure> tags
        //const figures = item.querySelectorAll("figure"); //removing figure elements 
        //figures.forEach(fig => fig.remove());
       
      const linkInputEl = item.querySelector(`#edit-link-${postId}`);
    // Insert the image textarea after the input
    linkInputEl.insertAdjacentHTML(
    "afterend",
    `<textarea id="edit-img-${postId}" class="edit-textarea">${postData.image}</textarea>`
);



    } else {
    // ================= SAVE TO FIREBASE =================
    isEditing = false;
    editBtn.textContent = "✏️";

    const newTitle = document.getElementById(`edit-title-${postId}`).value.trim();
    const newDate = document.getElementById(`edit-date-${postId}`).value.trim();
    const newDescription = document.getElementById(`edit-description-${postId}`).value.trim();
    const newImage = document.getElementById(`edit-img-${postId}`).value.trim();
    const newLink = document.getElementById(`edit-link-${postId}`).value.trim();


    const updatedData = {
        ...postData,
        title: newTitle,
        date: newDate,
        description: newDescription,
        image: newImage,
        link: newLink
    };

    // 1. Update Firestore
    await updatePost(postId, updatedData);

    // 2. Show success message
    //showToast(`Post "${newTitle}" updated!`);

    // 3. Re-render post UI
    container.removeChild(item);
    renderPost(postId, updatedData, user);
}   
});
const deleteBtn = item.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async () => {
    try {
        await deletePost(postId); // delete from Firestore
        container.removeChild(item);   // remove from DOM immediately
        //showToast(`Post "${postData.title}" deleted!`);
    } catch (err) {
        console.error("Failed to delete post:", err);
        //showToast("Failed to delete post.");
    }
});
}

async function loadPosts(user) {
    try {
        const snapshot = await getAllPosts();
        snapshot.forEach((doc) => renderPost(doc.id, doc.data(), user));
        toggleAuthElements(user);
    } catch (err) {
        console.error("Error loading posts:", err);
        const container = document.getElementById("mediaContainer");
        if (container) container.innerHTML = "<p>Failed to load posts.</p>";
    }
}

// ================ Render/Load Current Blog Posts ================

function renderBlogPost(postId, postData, user) {
    const container = document.getElementById("blogContainer");
    const item = document.createElement("div");
    item.classList.add("media-item");
    item.dataset.id = postId;

    if (postData.pinned) item.dataset.pinned = "true";

    item.innerHTML = `
      <div class="media-actions hidden" data-auth="required">
        <button class="pin-btn">📌</button>
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
    </div>
      <h3 class="media-title">${postData.title}</h3>
      <p class="media-date">${postData.date}</p>
      <a href="${postData.link}" target="_blank">`

    for (let i = 0; i < postData.images.length; i++) { //esentially loops through all th images
        item.innerHTML += `
        <figure> 
            <img src="${postData.images[i]}" alt="Image">
            <figcaption>Figure ${i+1}</figcaption></figure>`;
    }//each image gets its own figure block with caption
    item.innerHTML += `</a><br><p class="media-description">${postData.description}</p>`;

    container.appendChild(item);

    const pinBtn = item.querySelector(".pin-btn");
    pinBtn.addEventListener("click", async () => {
        const currentlyPinned = item.dataset.pinned === "true";
        const newPinned = await togglePin(postId, currentlyPinned);

        postData.pinned = newPinned;
        item.dataset.pinned = newPinned ? "true" : "false";

        // Re-sort DOM
        container.removeChild(item);
        if (newPinned) {
            container.insertBefore(item, container.firstChild);
        } else {
            container.appendChild(item);
        }

        showToast(`Post "${postData.title}" ${newPinned ? "pinned" : "unpinned"}!`);
    });
    const editBtn = item.querySelector(".edit-btn");
        let isEditing = false;

    editBtn.addEventListener("click", async () => {
    if (!isEditing) {
        // ================= ENTER EDIT MODE =================
        isEditing = true;
        editBtn.textContent = "✅"; // Show save icon

        // Get elements
        const titleEl = item.querySelector(".media-title");
        const dateEl = item.querySelector(".media-date");
        const descEl = item.querySelector(".media-description");
        const imageList = postData.images.join("\n");

        // Convert title to <input>
        titleEl.outerHTML = `
            <input id="edit-title-${postId}" class="edit-input" value="${postData.title}">
        `;

        // Convert date to <input type="date">
        dateEl.outerHTML = `
        <input id="edit-date-${postId}" class="edit-input" value="${postData.date}">
        `;

        // Convert description to <textarea>
        descEl.outerHTML = `
            <textarea id="edit-description-${postId}" class="edit-textarea">${postData.description}</textarea>
        `;
        
        // Remove existing <figure> tags
        const figures = item.querySelectorAll("figure"); //removing figure elements 
        figures.forEach(fig => fig.remove());

        // Insert textarea where the images were
        const linkEl = item.querySelector("a");
        linkEl.insertAdjacentHTML( // DOM method that lets you insert HTM
        "afterend", // so the <a> doesnt get triggered and doesnt launch to a new page.
        `<textarea id="edit-img-${postId}" class="edit-textarea">${imageList}</textarea>`
    );

    } else {
    // ================= SAVE TO FIREBASE =================
    isEditing = false;
    editBtn.textContent = "✏️";

    const newTitle = document.getElementById(`edit-title-${postId}`).value.trim();
    const newDate = document.getElementById(`edit-date-${postId}`).value.trim();
    const newDescription = document.getElementById(`edit-description-${postId}`).value.trim();

    const newImages = document
    .getElementById(`edit-img-${postId}`)
    .value
    .split("\n") // splits it by line to get an array of images
    .map(url => url.trim()) 
    .filter(url => url !== ""); // removes empty lines

    const updatedData = {
        ...postData,
        title: newTitle,
        date: newDate,
        description: newDescription,
        images: newImages
    };

    // 1. Update Firestore
    await updateBlogPost(postId, updatedData);

    // 2. Show success message
    //showToast(`Post "${newTitle}" updated!`);

    // 3. Re-render post UI
    container.removeChild(item);
    renderBlogPost(postId, updatedData, user);
}   
});
    const deleteBtn = item.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async () => {
    try {
        await deleteBlogPost(postId); // delete from Firestore
        container.removeChild(item);   // remove from DOM immediately
        //showToast(`Post "${postData.title}" deleted!`);
    } catch (err) {
        console.error("Failed to delete post:", err);
        //showToast("Failed to delete post.");
    }
});
}

async function loadBlogPosts(user) {
    try {
        const snapshot = await getAllBlogPosts();
        snapshot.forEach((doc) => renderBlogPost(doc.id, doc.data(), user));
        toggleAuthElements(user);
    } catch (err) {
        console.error("Error loading posts:", err);
        const container = document.getElementById("blogContainer");
        if (container) container.innerHTML = "<p>Failed to load posts.</p>";
    }
}


// ================= Render/Load Contacts =================
// Generic Contact Rendering/Loading
function renderContact(contactId, contactData, user, collectionName) {
    const container = document.getElementById("contactContainer");
    const item = document.createElement("div");
    item.classList.add("contact-item");
    item.dataset.id = contactId;

    item.innerHTML = `
        <h4 class="contact-name">${contactData.name}</h4>
        <p>${contactData.description ?? ""}</p>
        <p><a href="${contactData.link}" target="_blank">${contactData.link}</a></p>
        <div class="contact-actions hidden" data-auth="required">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    container.appendChild(item);
    toggleAuthElements(user);

    const editBtn = item.querySelector(".edit-btn");
    const deleteBtn = item.querySelector(".delete-btn");
    let isEditing = false;

    editBtn.addEventListener("click", async () => {
        if (!isEditing) {
            // ================= ENTER EDIT MODE =================
            isEditing = true;
            editBtn.textContent = "Save";

            const nameEl = item.querySelector(".contact-name");
            const descEl = item.querySelector("p:nth-of-type(1)");
            const linkEl = item.querySelector("p:nth-of-type(2) a");

            // Replace with input/textarea for editing
            nameEl.outerHTML = `<textarea id="edit-name-${contactId}" class="edit-textarea">${contactData.name}</textarea>`;
            descEl.outerHTML = `<input id="edit-desc-${contactId}" class="edit-input" value="${contactData.description}">`;
            linkEl.outerHTML = `<input id="edit-link-${contactId}" class="edit-input" value="${contactData.link}">`;
        } else {
            // ================= SAVE CHANGES =================
            isEditing = false;
            editBtn.textContent = "Edit";

            const newName = document.getElementById(`edit-name-${contactId}`).value.trim();
            const newDescription = document.getElementById(`edit-desc-${contactId}`).value.trim();
            const newLink = document.getElementById(`edit-link-${contactId}`).value.trim();

            const updatedData = {
                ...contactData,
                name: newName,
                description: newDescription,
                link: newLink
            };

            // Update Firestore
            await updateContact(contactId, updatedData, collectionName);

            // Remove old item and re-render
            container.removeChild(item);
            renderContact(contactId, updatedData, user, collectionName);
        }
    });

    deleteBtn.addEventListener("click", async () => {
        try {
            await deleteContact(contactId, collectionName);
            container.removeChild(item);
        } catch (err) {
            console.error("Failed to delete contact:", err);
        }
    });
}


async function loadContacts(user, getContactsFn, headingText) {
    const container = document.getElementById("contactContainer");
    if (!container) return;

    // Create a section wrapper with heading
    const section = document.createElement("div");
    section.classList.add("contact-group");
    section.innerHTML = `<h3 class="contact-headings">${headingText}</h3>`;
    container.appendChild(section);
    let collectionName = "";
    if (headingText.includes("2025")) collectionName = "contactInfo2025";
    else if (headingText.includes("2022")) collectionName = "contactInfo2021_2022";
    else if (headingText.includes("Project")) collectionName = "contactInfo2021_Project";

    try {
        const snapshot = await getContactsFn();
        console.log(`Contacts found for ${headingText}:`, snapshot.size);
        snapshot.forEach((doc) => {
            console.log("Contact doc:", doc.id, doc.data());
            renderContact(doc.id, doc.data(), user, collectionName);
        });
    } catch (err) {
        console.error(`Error loading contacts for ${headingText}:`, err);
        section.innerHTML += "<p>Failed to load contacts.</p>";
    }
}


// ================ Admin Features ================
async function showAdminFeatures() {
    const email = document.getElementById("email")?.value;
    const pass = document.getElementById("password")?.value;

    if (email === CLIENT_EMAIL) {
        try {
            const result = await checkAdminLogin(auth, email, pass);
            if (result) {
                console.log("Admin Signed In");
                const adminInterface = document.getElementById("adminInterface");
                if (adminInterface) adminInterface.style.display = "flex";
                document.querySelectorAll(".contact-actions").forEach(el => {
                    el.style.display = "flex";
                });
            }
        } catch (err) {
            console.error("Admin login failed:", err);
        }
    }
}

// Upload media and contacts for admin
async function adminUpload() {
    const mediaForm = document.getElementById("postForm");
    const contactForm = document.getElementById("contactForm");

    mediaForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission and page refresh

        const postTitle = document.getElementById("post-header").value;
        const postLink = document.getElementById("post-link").value;
        const postDate = document.getElementById("post-date").value;
        const postContent = document.getElementById("post-content").value;
        const postImage = document.getElementById("post-img").value;

        const data = {title: postTitle, link: postLink, date: postDate, description: postContent, image: postImage};

        await addDoc(collection(db, "mediaPosts"), data);
        
    });

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Prevent default form submission and page refresh

        const contactName = document.getElementById("contact_name").value;
        const contactDes = document.getElementById("contact_des").value;
        const contactLink = document.getElementById("contact_link").value;

        const data = {name: contactName, description: contactDes, link: contactLink};

        await addDoc(collection(db, "contactInfo2025"), data);
    });
}


// ================ DOMContentLoaded Setup ================
document.addEventListener("DOMContentLoaded", () => {
    setupLoginForm();
    setupRegisterForm();
    setupPostForm();
    setupLoginToggle();
    setupLogoutButton();
    initAuthUI();
    showAdminFeatures();
    adminUpload();

    const forgotP = document.getElementById("forgotPassword");
    if (forgotP) forgotP.addEventListener("click", handleForgotPassword);

    const path = window.location.pathname;
    if (path.includes("media.html")) {
        watchAuthState((user) => loadPosts(user));
    }
    if (path.includes("contact.html")) {
        watchAuthState((user) => {
            loadContacts(user, getAllContacts25, "Contacts 2025");
            loadContacts(user, getAllContacts21, "Contacts 2021–2022");
            loadContacts(user, getAllContacts21Pro, "Project Contacts 2021");
        });
    }
    if (path.includes("blog.html")) {
        watchAuthState((user) => loadBlogPosts(user))};

    const btn = document.getElementById("currentProjectBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = "blog.html";
        });
    }
});

// ================ Delegated Click Handler ================
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
                const currentlyPinned = item.dataset.pinned === "true";
                const newPinned = await togglePin(postId, currentlyPinned);

                item.dataset.pinned = newPinned ? "true" : "false";

                // Show styled modal
                const pinModal = document.getElementById("pinModal");
                const pinMessage = document.getElementById("pinMessage");
                const closeBtn = document.getElementById("closePinModal");

                pinMessage.innerText = `Post "${item.querySelector(".media-title").innerText}" has been ${newPinned ? "pinned" : "unpinned"}.`;
                pinModal.style.display = "block";

                // Manual close
                closeBtn.onclick = () => {
                    pinModal.style.display = "none";
                };

                // Auto-dismiss after 3 seconds
                setTimeout(() => {
                    pinModal.style.display = "none";
                }, 3000);
            } catch (err) {
                alert("You don’t have permission to change pin status.");
            }
        }


    });
});
