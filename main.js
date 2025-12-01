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
    addContact,
    updateContact,
    deleteContact,
    togglePin,
    updatePost,
    deletePost,
    uploadImage,
    checkAdminLogin,
    auth,
    ADMIN_EMAIL,
    getAllBlogPosts,
    addComment,
    listenToComments,
    deleteComment,
    addMediaPost,
    cleanupDeletedComments
} from "./firebase.js";

// ================= UI Toggles =================
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
    document.querySelectorAll('[data-auth="admin"]').forEach(el => {
        el.classList.toggle("hidden", !isAdmin);
    });
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

// ================= Forms =================
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
            await createPost({title, date, link, description: content, image: imageUrl});
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
        await signInUser(email, pass);
        document.getElementById("signinMessage").innerText = "Sign-in successful!";
        document.getElementById("signinMessage").style.color = "green";
        window.location.href = "index.html";
    } catch (error) {
        document.getElementById("signinMessage").innerText = error.message;
        document.getElementById("signinMessage").style.color = "red";
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById("registeremail").value;
    const pass = document.getElementById("registerpassword").value;
    try {
        await registerUser(email, pass);
        document.getElementById("signinMessageR").innerText = "Account created successfully!";
        document.getElementById("signinMessageR").style.color = "pink";
        document.getElementById("registerForm").reset();
    } catch (error) {
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
        alert("Password reset email sent!");
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// ================= Media =================
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
}

async function loadPosts(user) {
    try {
        const snapshot = await getAllPosts();
        snapshot.forEach((doc) => renderPost(doc.id, doc.data(), user));
        toggleAuthElements(user);
    } catch (err) {
        const container = document.getElementById("mediaContainer");
        if (container) container.innerHTML = "<p>Failed to load posts.</p>";
    }
}

// ================= Blog =================
function renderBlogPost(postId, postData, user) {
    const container = document.getElementById("blogContainer");
    const item = document.createElement("div");
    item.classList.add("media-item");
    item.dataset.id = postId;
    if (postData.pinned) item.dataset.pinned = "true";

    // Build post content
    let html = `
    <div class="media-actions hidden" data-auth="required">
      <button class="pin-btn">📌</button>
      <button class="edit-btn">✏️</button>
      <button class="delete-btn">🗑️</button>
    </div>
    <h3 class="media-title">${postData.title}</h3>
    <p class="media-date">${postData.date}</p>
  `;

    // Optional link/images
    if (postData.link) {
        html += `<a href="${postData.link}" target="_blank">`;
        if (Array.isArray(postData.images)) {
            for (let i = 0; i < postData.images.length; i++) {
                html += `
          <figure>
            <img src="${postData.images[i]}" alt="Image">
            <figcaption>Figure ${i + 1}</figcaption>
          </figure>`;
            }
        }
        html += `</a>`;
    }

    html += `<p class="media-description">${postData.description}</p>`;
    item.innerHTML = html;

    // Add comment section
    const commentsEl = document.createElement("div");
    commentsEl.classList.add("comments");
    commentsEl.dataset.postId = postId;
    commentsEl.innerHTML = `
    <h4>Comments</h4>
    <div class="comment-list"></div>
    <form class="comment-form">
      <textarea placeholder="Write a comment..." required></textarea>
      <button type="submit">Post Comment</button>
    </form>
  `;
    item.appendChild(commentsEl);

    container.appendChild(item);

    // Wire up pin button
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

    // Wire up threaded comments
    renderCommentSection(postId, user);
}

async function loadBlogPosts(user) {
    try {
        const snapshot = await getAllBlogPosts();
        snapshot.forEach((doc) => renderBlogPost(doc.id, doc.data(), user));
        toggleAuthElements(user);
    } catch (err) {
        const container = document.getElementById("blogContainer");
        if (container) container.innerHTML = "<p>Failed to load posts.</p>";
    }
}

// ================= Comments =================
export function renderCommentSection(postId, user) {
    const postEl = document.querySelector(`.media-item[data-id="${postId}"]`);
    if (!postEl) return;

    const commentsEl = postEl.querySelector(".comments");
    const form = commentsEl.querySelector(".comment-form");
    const list = commentsEl.querySelector(".comment-list");

    // Handle new top-level comment
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = form.querySelector("textarea").value.trim();
        if (!text) return;
        await addComment(postId, user, text, null);
        form.reset();
    });

    // Listen for all comments
    listenToComments(postId, (snapshot) => {
        list.innerHTML = "";
        const comments = [];
        snapshot.forEach((docSnap) => {
            comments.push({id: docSnap.id, ...docSnap.data()});
        });

        // Group by parent
        const byParent = {};
        comments.forEach(c => {
            const parent = c.parentId || "root";
            if (!byParent[parent]) byParent[parent] = [];
            byParent[parent].push(c);
        });

        function renderThread(parentId, container, depth = 0) {
            (byParent[parentId] || []).forEach(c => {
                const item = document.createElement("div");
                item.classList.add("comment-item");
                item.style.marginLeft = `${depth * 20}px`;
                item.dataset.id = c.id;

                const canDelete = user.isAdmin || (c.authorId === user.uid);

                if (c.deleted) {
                    if (byParent[c.id] && byParent[c.id].length > 0) {
                        item.innerHTML = `<p><em>[deleted]</em></p><div class="reply-list"></div>`;
                    } else {
                        return;
                    }
                } else {
                    item.innerHTML = `
            <p><strong>${c.authorName}</strong>: ${c.text}</p>
            <small>${c.timestamp?.toDate().toLocaleString() || ""}</small>
            <button class="btn btn-secondary small reply-btn">Reply</button>
            ${canDelete ? `<button class="btn btn-danger small delete-comment">Delete</button>` : ""}
            <button class="btn btn-secondary small toggle-replies hidden">Show Replies</button>
            <div class="reply-list"></div>
          `;
                }

                const replyList = item.querySelector(".reply-list");
                const toggleBtn = item.querySelector(".toggle-replies");

                if (byParent[c.id] && byParent[c.id].length > 0 && toggleBtn) {
                    toggleBtn.classList.remove("hidden");
                    toggleBtn.addEventListener("click", () => {
                        const isHidden = replyList.classList.toggle("collapsed");
                        toggleBtn.textContent = isHidden ? "Show Replies" : "Hide Replies";
                    });
                }

                const replyBtn = item.querySelector(".reply-btn");
                if (replyBtn) {
                    replyBtn.addEventListener("click", () => {
                        const replyForm = document.createElement("form");
                        replyForm.classList.add("reply-form");
                        replyForm.innerHTML = `
              <textarea placeholder="Write a reply..." required></textarea>
              <button type="submit" class="btn btn-primary small">Post Reply</button>
            `;
                        replyList.appendChild(replyForm);

                        replyForm.addEventListener("submit", async (e) => {
                            e.preventDefault();
                            const text = replyForm.querySelector("textarea").value.trim();
                            if (!text) return;
                            await addComment(postId, user, text, c.id);
                            replyForm.remove();
                        });
                    });
                }

                const deleteBtn = item.querySelector(".delete-comment");
                if (deleteBtn) {
                    deleteBtn.addEventListener("click", () => {
                        const modal = document.getElementById("deleteModal");
                        modal.classList.add("show");

                        const confirmBtn = document.getElementById("confirmDelete");
                        const cancelBtn = document.getElementById("cancelDelete");

                        confirmBtn.onclick = null;
                        cancelBtn.onclick = null;

                        confirmBtn.onclick = async () => {
                            await deleteComment(postId, c.id);
                            modal.classList.remove("show");
                        };
                        cancelBtn.onclick = () => modal.classList.remove("show");
                    });
                }

                renderThread(c.id, replyList, depth + 1);
                container.appendChild(item);
            });
        }

        renderThread("root", list);
    });
}

// ================= Contacts =================
function renderContact(contactId, contactData, user, section) {
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
    section.appendChild(item);
    toggleAuthElements(user);
}

async function loadContacts(user, getContactsFn, headingText) {
    const container = document.getElementById("contactContainer");
    if (!container) return;
    const section = document.createElement("div");
    section.classList.add("contact-group");
    section.innerHTML = `<h3 class="contact-headings">${headingText}</h3>`;
    container.appendChild(section);

    try {
        const snapshot = await getContactsFn();
        snapshot.forEach((doc) => renderContact(doc.id, doc.data(), user, section));
    } catch {
        section.innerHTML += "<p>Failed to load contacts.</p>";
    }
}

// ================= Admin Features =================
// ================= Admin Features =================
async function showAdminFeatures() {
    const email = document.getElementById("email")?.value;
    const pass = document.getElementById("password")?.value;

    if (email === ADMIN_EMAIL) {
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

// ================= DOMContentLoaded Setup =================
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
        watchAuthState((user) => loadBlogPosts(user));
    }

    const btn = document.getElementById("currentProjectBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = "blog.html";
        });
    }
});

// ================= Upload Media/Contacts from admin forms =================
document.addEventListener("DOMContentLoaded", () => {
    const mediaForm = document.getElementById("postForm");
    const contactForm = document.getElementById("contactForm");

    if (mediaForm) {
        mediaForm.addEventListener("uploadMedia", async (event) => {
            event.preventDefault();
            const formData = new FormData(mediaForm);
            const data = {
                title: formData.get("post-header"),
                link: formData.get("post-link"),
                date: formData.get("post-date"),
                description: formData.get("post-content"),
                image: formData.get("post-img")
            };
            addMediaPost(data);
        });
    }

    if (contactForm) {
        contactForm.addEventListener("uploadContact", (event) => {
            event.preventDefault();
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get("contact_name"),
                description: formData.get("contact_des"),
                link: formData.get("contact_link")
            };
            addContact(data);
        });
    }
});

// ================= Delegated Click Handler =================
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

                // Show styled pin modal
                const pinModal = document.getElementById("pinModal");
                const pinMessage = document.getElementById("pinMessage");
                const closeBtn = document.getElementById("closePinModal");

                pinMessage.innerText = `Post "${item.querySelector(".media-title").innerText}" has been ${newPinned ? "pinned" : "unpinned"}.`;
                pinModal.style.display = "block";

                closeBtn.onclick = () => {
                    pinModal.style.display = "none";
                };

                setTimeout(() => {
                    pinModal.style.display = "none";
                }, 3000);
            } catch (err) {
                alert("You don’t have permission to change pin status.");
            }
        }
    });
});

