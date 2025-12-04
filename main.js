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
    toggleBlogPin,
    updatePost,
    deletePost,
    uploadMediaPost,
    uploadContact,
    uploadImage,
    checkAdminLogin,
    auth,
    createBlogPost,
    ADMIN_EMAILS,
    getAllBlogPosts,
    addComment,
    listenToComments,
    deleteComment,
    loadContactsByCollection,
    getUserInfo,
    saveUserInfo,
    deleteBlogPost,
    updateBlogPost
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
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);

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
        const image = document.getElementById("post_img").value;

        try {
            await createPost({title: title, date: date, link: link, description: content, image: image});
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
      <p class="media-description">${postData.description ?? postData.content ?? ""}</p>
    `;


    container.appendChild(item);

    // 🔑 Only call the helper once
    attachMediaActionListeners(item, postId, postData, user);
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

    // Create card wrapper
    const item = document.createElement("div");
    item.className = "media-item";
    item.dataset.id = postId;
    item.dataset.pinned = postData.pinned ? "true" : "false";

    // Build card content
    item.innerHTML = `
      <h3 class="media-title">${postData.title || ""}</h3>
      <p class="media-date">${postData.date || ""}</p>
      <div class="media-figures">
        ${(postData.images || []).map(url => `<figure><img src="${url}" alt="Image"><figcaption>Figure ${postData.images.indexOf(url)+1}</figcaption></figure><br>`).join("")}
      </div>
      <p class="media-description">${postData.description || ""}</p>
      <div class="media-actions">
        <button class="pin-btn">${postData.pinned ? "📌" : "📍"}</button>
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
      </div>
    
      <div class="comments">
          <div class="comment-list"></div>
            <form class="comment-form">
                <textarea placeholder="Write a comment..." required></textarea>
                <button type="submit" class="btn btn-primary small">Post Comment</button>
            </form>
        </div>

`;


    // Append to container
    container.appendChild(item);

    // Attach listeners with full context
    attachBlogActionListeners(item, postId, postData, user);

    // Render Comment Section
    renderCommentSection(postId, user, document.getElementById(`comments-${postId}`));
}


function attachBlogActionListeners(item, postId, postData, user) {
    const container = item.parentElement;
    const pinBtn = item.querySelector(".pin-btn");
    const editBtn = item.querySelector(".edit-btn");
    const deleteBtn = item.querySelector(".delete-btn");

    // --- Pin button ---
    if (pinBtn) {
        pinBtn.addEventListener("click", async () => {
            const currentlyPinned = item.dataset.pinned === "true";
            try {
                const newPinned = await toggleBlogPin(postId, currentlyPinned);
                item.dataset.pinned = newPinned ? "true" : "false";
                pinBtn.textContent = newPinned ? "📌" : "📍";
                showToast(`Post ${newPinned ? "pinned" : "unpinned"}.`);

                if (newPinned) {
                    container.insertBefore(item, container.firstChild);
                }
            } catch (err) {
                console.error("Pin toggle failed:", err);
                showToast("Failed to change pin status.");
            }
        });
    }

    // --- Edit button ---
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            openEditModal(postId, postData, user, "blog");
        });
    }

    // --- Delete button ---
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            const modal = document.getElementById("deletePostModal");
            const titleEl = document.getElementById("deleteModalTitle");
            const messageEl = document.getElementById("deleteModalMessage");

            // Adjust text depending on context
            if (item.closest("#blogContainer")) {
                titleEl.textContent = "Delete Blog Post";
                messageEl.textContent = "Are you sure you want to delete this blog post?";
            } else {
                titleEl.textContent = "Delete Media Post";
                messageEl.textContent = "Are you sure you want to delete this media post?";
            }

            modal.classList.remove("hidden");
            modal.classList.add("show");

            const confirmBtn = document.getElementById("confirmPostDelete");
            const cancelBtn = document.getElementById("cancelPostDelete");

            // Clear old listeners
            const newConfirm = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

            // Confirm deletes
            newConfirm.addEventListener("click", async () => {
                try {
                    if (item.closest("#blogContainer")) {
                        await deleteBlogPost(postId);
                    } else {
                        await deletePost(postId);
                    }
                    const existing = document.querySelector(`.media-item[data-id="${postId}"]`);
                    if (existing) existing.remove();
                    showToast("Post deleted.");
                } catch (err) {
                    console.error("Failed to delete post:", err);
                    showToast("Failed to delete post.");
                } finally {
                    modal.classList.remove("show");
                    modal.classList.add("hidden");
                }
            });

            // Cancel closes
            newCancel.addEventListener("click", () => {
                modal.classList.remove("show");
                modal.classList.add("hidden");
            });
        });
    }

}

function attachMediaActionListeners(item, postId, postData, user) {
    const container = item.parentElement;
    const pinBtn = item.querySelector(".pin-btn");
    const editBtn = item.querySelector(".edit-btn");
    const deleteBtn = item.querySelector(".delete-btn");

    // --- Pin button ---
    if (pinBtn) {
        pinBtn.addEventListener("click", async () => {
            const currentlyPinned = item.dataset.pinned === "true";
            try {
                const newPinned = await togglePin(postId, currentlyPinned);
                item.dataset.pinned = newPinned ? "true" : "false";
                showToast(`Media post ${newPinned ? "pinned" : "unpinned"}.`);

                // Reposition in container
                container.removeChild(item);
                if (newPinned) {
                    container.insertBefore(item, container.firstChild);
                } else {
                    container.appendChild(item);
                }
            } catch (err) {
                console.error("Pin toggle failed:", err);
                showToast("Failed to change pin status.");
            }
        });
    }

    // --- Edit button ---
    if (editBtn) {
        editBtn.addEventListener("click", () => {
            openEditModal(postId, postData, user, "media");
        });
    }

    // --- Delete button ---
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            const modal = document.getElementById("deletePostModal");
            const titleEl = document.getElementById("deleteModalTitle");
            const messageEl = document.getElementById("deleteModalMessage");

            // Adjust text depending on context
            if (item.closest("#blogContainer")) {
                titleEl.textContent = "Delete Blog Post";
                messageEl.textContent = "Are you sure you want to delete this blog post?";
            } else {
                titleEl.textContent = "Delete Media Post";
                messageEl.textContent = "Are you sure you want to delete this media post?";
            }

            modal.classList.remove("hidden");
            modal.classList.add("show");

            const confirmBtn = document.getElementById("confirmPostDelete");
            const cancelBtn = document.getElementById("cancelPostDelete");

            // Clear old listeners
            const newConfirm = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

            // Confirm deletes
            newConfirm.addEventListener("click", async () => {
                try {
                    if (item.closest("#blogContainer")) {
                        await deleteBlogPost(postId);
                    } else {
                        await deletePost(postId);
                    }
                    const existing = document.querySelector(`.media-item[data-id="${postId}"]`);
                    if (existing) existing.remove();
                    showToast("Post deleted.");
                } catch (err) {
                    console.error("Failed to delete post:", err);
                    showToast("Failed to delete post.");
                } finally {
                    modal.classList.remove("show");
                    modal.classList.add("hidden");
                }
            });

            // Cancel closes
            newCancel.addEventListener("click", () => {
                modal.classList.remove("show");
                modal.classList.add("hidden");
            });
        });
    }

}


async function loadBlogPosts(user) {
    try {
        const container = document.getElementById("blogContainer");
        if (container) container.innerHTML = ""; // clear before rendering

        const snapshot = await getAllBlogPosts();
        snapshot.forEach((doc) => renderBlogPost(doc.id, doc.data(), user));

        toggleAuthElements(user);
    } catch (err) {
        console.error("Error loading posts:", err);
        const container = document.getElementById("blogContainer");
        if (container) container.innerHTML = "<p>Failed to load posts.</p>";
    }
}


// ================ Comments ================
function renderCommentSection(postId, user) {
    const postEl = document.querySelector(`.media-item[data-id="${postId}"]`);
    if (!postEl) return;

    const commentsEl = postEl.querySelector(".comments");
    if (!commentsEl) return; // guard

    const form = commentsEl.querySelector(".comment-form");
    const list = commentsEl.querySelector(".comment-list");
    if (!form || !list) return; // guard

    // Prevent multiple listeners
    if (form.dataset.listenerAttached !== "true") {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!user) {
                const loginModal = document.getElementById("loginModal");
                const closeBtn = document.getElementById("closeLoginModal");
                const goToLogin = document.getElementById("goToLogin");

                loginModal.classList.add("show");

                closeBtn.onclick = () => {
                    loginModal.classList.remove("show");
                };

                goToLogin.onclick = () => {
                    window.location.href = "login.html";
                };

                return;
            }
            const text = form.querySelector("textarea").value.trim();
            if (!text) return;
            await addComment(postId, user, text, null);
            form.reset();
        });
        form.dataset.listenerAttached = "true";
    }

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

                const canDelete = ADMIN_EMAILS.includes(user.email) || (c.authorId === user.uid);

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
                        modal.classList.remove("hidden");
                        modal.classList.add("show");

                        const confirmBtn = document.getElementById("confirmDelete");
                        const cancelBtn = document.getElementById("cancelDelete");

                        // Clear old listeners by cloning
                        const newConfirm = confirmBtn.cloneNode(true);
                        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

                        const newCancel = cancelBtn.cloneNode(true);
                        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

                        // Attach fresh listeners
                        newConfirm.addEventListener("click", async () => {
                            try {
                                await deleteComment(postId, c.id);
                                modal.classList.remove("show");
                                modal.classList.add("hidden");
                            } catch (err) {
                                console.error("Failed to delete comment:", err);
                                showToast("Failed to delete comment.");
                                modal.classList.remove("show");
                                modal.classList.add("hidden");
                            }
                        });

                        newCancel.addEventListener("click", () => {
                            modal.classList.remove("show");
                            modal.classList.add("hidden");
                        });
                    });
                }

                renderThread(c.id, replyList, depth + 1);
                container.appendChild(item);
            });
        }

        renderThread("root", list);
    });
}


// ================ Render/Load Contacts ================
function renderContact(contactId, contactData, user, collectionName, listEl) {
    // Create the contact card
    const item = document.createElement("div");
    item.classList.add("contact-item");
    item.dataset.id = contactId;

    item.innerHTML = `
        <h4 class="contact-name">${contactData.name}</h4>
        <p>${contactData.description ?? ""}</p>
        ${contactData.link ? `<p><a href="${contactData.link}" target="_blank">${contactData.link}</a></p>` : ""}
        <div class="contact-actions hidden" data-auth="required">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    // Append to the correct section list
    listEl.appendChild(item);

    // Toggle auth‑restricted buttons
    toggleAuthElements(user);

    const editBtn = item.querySelector(".edit-btn");
    const deleteBtn = item.querySelector(".delete-btn");
    let isEditing = false;

    // Edit / Save toggle
    editBtn.addEventListener("click", async () => {
        if (!isEditing) {
            isEditing = true;
            editBtn.textContent = "Save";

            const nameEl = item.querySelector(".contact-name");
            const descEl = item.querySelector("p:nth-of-type(1)");
            const linkEl = item.querySelector("p:nth-of-type(2) a");

            nameEl.outerHTML = `<textarea id="edit-name-${contactId}" class="edit-textarea">${contactData.name}</textarea>`;
            descEl.outerHTML = `<input id="edit-desc-${contactId}" class="edit-input" value="${contactData.description ?? ""}">`;
            if (linkEl) {
                linkEl.outerHTML = `<input id="edit-link-${contactId}" class="edit-input" value="${contactData.link ?? ""}">`;
            }
        } else {
            isEditing = false;
            editBtn.textContent = "Edit";

            const newName = document.getElementById(`edit-name-${contactId}`).value.trim();
            const newDescription = document.getElementById(`edit-desc-${contactId}`).value.trim();
            const newLinkInput = document.getElementById(`edit-link-${contactId}`);
            const newLink = newLinkInput ? newLinkInput.value.trim() : "";

            const updatedData = {
                ...contactData,
                name: newName,
                description: newDescription,
                link: newLink,
            };

            await updateContact(contactId, updatedData, collectionName);

            // Re‑render with updated data
            listEl.removeChild(item);
            renderContact(contactId, updatedData, user, collectionName, listEl);
        }
    });

    // Delete button
    deleteBtn.addEventListener("click", async () => {
        try {
            await deleteContact(contactId, collectionName);
            listEl.removeChild(item);
        } catch (err) {
            console.error("Failed to delete contact:", err);
        }
    });
}

async function loadContacts(user, getContactsFn, headingText) {
    const container = document.getElementById("contactContainer");
    if (!container) return;

    // Create a section with a heading and a list container
    const section = document.createElement("div");
    section.classList.add("contact-group");
    section.innerHTML = `<h3 class="contact-headings">${headingText}</h3>`;

    const list = document.createElement("div");
    list.classList.add("contact-list");
    section.appendChild(list);

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
            // Pass the list container into renderContact so items stay inside their section
            renderContact(doc.id, doc.data(), user, collectionName, list);
        });
    } catch (err) {
        console.error(`Error loading contacts for ${headingText}:`, err);
        section.innerHTML += "<p>Failed to load contacts.</p>";
    }
}

// ================ Admin Features ================
function showAdminFeatures(user) {
    if (user && ADMIN_EMAILS.includes(user.email)) {
        console.log("Admin login successful:", user.email);

        document.querySelectorAll("[data-auth='required']").forEach((el) => {
            el.classList.remove("hidden");
        });

        const adminBanner = document.getElementById("adminBanner");
        if (adminBanner) {
            adminBanner.textContent = `Logged in as Admin: ${user.email}`;
            adminBanner.classList.remove("hidden");
        }

        const adminInterface = document.getElementById("adminInterface");
        if (adminInterface) adminInterface.style.display = "flex";
        document.querySelectorAll(".contact-actions").forEach((el) => {
            el.style.display = "flex";
        });
    } else {
        console.error("Admin login failed: unauthorized user");
    }
}


function adminBlogUpload() {
    const blogForm = document.getElementById("blogForm");
    if (!blogForm) return;

    blogForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("titleInput").value.trim();
        const des = document.getElementById("descInput").value.trim();
        const rawDate = document.getElementById("dateInput").value; // YYYY-MM-DD from <input type="date">
        const imageString = document.getElementById("imageInput").value.trim();
        const images = imageString.split(" ").map(u => u.trim()).filter(u => u.length > 0);

        // Convert YYYY-MM-DD into Month Day, Year
        const formattedDate = rawDate
            ? new Date(rawDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
            })
            : "";

        try {
            await createBlogPost({
                title,
                description: des,
                images,
                date: formattedDate // stored/displayed as "December 3, 2025"
            });
            document.getElementById("blogMessage").innerText =
                "Blog uploaded successfully!";
            blogForm.reset();
        } catch (err) {
            console.error("Blog upload error:", err);
            document.getElementById("blogMessage").innerText =
                "Error uploading blog.";
        }
    });
}


function adminUpload() {
    const mediaForm = document.getElementById("postForm");
    const contactForm = document.getElementById("contactForm");

    if (mediaForm) {
        mediaForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const data = {
                title: document.getElementById("post-header").value.trim(),
                link: document.getElementById("post-link").value.trim(),
                date: document.getElementById("post-date").value.trim(),
                description: document.getElementById("post-content").value.trim(),
                image: document.getElementById("post-img").value.trim(),
            };

            try {
                await uploadMediaPost(data);
                showToast("Media post uploaded successfully!");
                mediaForm.reset();
            } catch (err) {
                console.error("Media upload error:", err);
                showToast("Error uploading media post.");
            }
        });
    }

    if (contactForm && !contactForm.dataset.listenerAttached) {
        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const data = {
                name: document.getElementById("contact_name").value.trim(),
                description: document.getElementById("contact_des").value.trim(),
                link: document.getElementById("contact_link").value.trim(),
            };

            try {
                await uploadContact(data);
                showToast("Contact uploaded successfully!");
                contactForm.reset();
            } catch (err) {
                console.error("Contact upload error:", err);
                showToast("Error uploading contact.");
            }
        });

        // Prevent duplicate listeners
        contactForm.dataset.listenerAttached = "true";
    }
}


// =================== Helper Functions ==============
function highlightMatches(element, query) {
    if (!element || !query) return;

    element.querySelectorAll(".highlight-text").forEach(span => {
        span.replaceWith(span.textContent);
    });

    const regex = new RegExp(`(${query})`, "gi");

    // Use a TreeWalker to find text nodes
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach(node => {
        const text = node.nodeValue;
        if (text.toLowerCase().includes(query.toLowerCase())) {
            const span = document.createElement("span");
            span.innerHTML = text.replace(regex, `<span class="highlight-text">$1</span>`);
            node.parentNode.replaceChild(span, node);
        }
    });
}

function openEditModal(postId, postData, user, type = "blog") {
    const modal = document.getElementById("editModal");
    const closeBtn = document.getElementById("closeEditModal");
    const cancelBtn = document.getElementById("cancelEdit");
    const form = document.getElementById("editForm");

    // Refresh postData from DOM each time
    const card = document.querySelector(`.media-item[data-id="${postId}"]`);
    if (card) {
        if (type === "blog") {
            postData = {
                title: card.querySelector(".media-title")?.textContent || postData.title || "",
                date: card.querySelector(".media-date")?.textContent || postData.date || "",
                description: card.querySelector(".media-description")?.textContent || postData.description || "",
                images: Array.from(card.querySelectorAll(".media-figures img")).map(img => img.src),
                pinned: card.dataset.pinned === "true"
            };
        } else {
            postData = {
                title: card.querySelector(".media-title")?.textContent || postData.title || "",
                date: card.querySelector(".media-date")?.textContent || postData.date || "",
                description: card.querySelector(".media-description")?.textContent || postData.description || "",
                link: card.querySelector("a")?.href || postData.link || "",
                image: card.querySelector("img")?.src || postData.image || "",
                pinned: card.dataset.pinned === "true"
            };
        }
    }

    // Normalize date for <input type="date">
    let dateValue = "";
    if (postData.date) {
        const d = new Date(postData.date);
        if (!isNaN(d)) {
            dateValue = d.toISOString().split("T")[0];
        }
    }

    // Populate fields
    document.getElementById("editTitle").value = postData.title || "";
    document.getElementById("editDate").value = dateValue;
    document.getElementById("editDescription").value = postData.description || "";

    if (type === "blog") {
        document.getElementById("editImages").value = Array.isArray(postData.images)
            ? postData.images.join("\n")
            : (postData.image || "");
        document.getElementById("editLink").value = "";
    } else {
        document.getElementById("editImages").value = postData.image || "";
        document.getElementById("editLink").value = postData.link || "";
    }

    // Show modal
    modal.classList.remove("hidden");
    modal.classList.add("show");

    const closeModal = () => {
        modal.classList.remove("show");
        modal.classList.add("hidden");
    };
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    // Save handler
    form.onsubmit = async (e) => {
        e.preventDefault();

        const rawDate = document.getElementById("editDate").value;
        const formattedDate = rawDate
            ? new Date(rawDate).toLocaleDateString("en-US", {month: "long", day: "numeric", year: "numeric"})
            : "";

        const updatedData = {
            title: document.getElementById("editTitle").value.trim(),
            date: formattedDate,
            description: document.getElementById("editDescription").value.trim(),
            pinned: postData.pinned
        };

        if (type === "blog") {
            updatedData.images = document.getElementById("editImages").value
                .split("\n")
                .map(u => u.trim())
                .filter(u => u.length > 0);
            try {
                await updateBlogPost(postId, updatedData);
                closeModal();
                const existing = document.querySelector(`.media-item[data-id="${postId}"]`);
                if (existing) existing.remove();
                renderBlogPost(postId, updatedData, user);
            } catch (err) {
                console.error("Failed to update blog post:", err);
                showToast("Failed to update blog post.");
                closeModal();
            }
        } else {
            updatedData.link = document.getElementById("editLink").value.trim();
            updatedData.image = document.getElementById("editImages").value.trim();
            try {
                await updatePost(postId, updatedData);
                closeModal();
                const existing = document.querySelector(`.media-item[data-id="${postId}"]`);
                if (existing) existing.remove();
                renderPost(postId, updatedData, user);
            } catch (err) {
                console.error("Failed to update media post:", err);
                showToast("Failed to update media post.");
                closeModal();
            }
        }

        // Reposition pinned
        const container = type === "blog"
            ? document.getElementById("blogContainer")
            : document.getElementById("mediaContainer");
        const newCard = document.querySelector(`.media-item[data-id="${postId}"]`);
        if (newCard) {
            if (updatedData.pinned) {
                container.insertBefore(newCard, container.firstChild);
            } else {
                container.appendChild(newCard);
            }
        }

        // 🔑 Ensure buttons are visible again
        toggleAuthElements(user);

        showToast("Post updated.");
    };
}


// ================ DOMContentLoaded Setup ================
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ main.js loaded");
    console.log("Path:", window.location.pathname);

    // ===== Setup =====
    setupLoginForm();
    setupRegisterForm();
    setupPostForm();
    setupLoginToggle();
    setupLogoutButton();
    initAuthUI();

    const forgotP = document.getElementById("forgotPassword");
    if (forgotP) forgotP.addEventListener("click", handleForgotPassword);

    // ===== Page Routes =====
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

    // ===== Blog Page =====
    if (path.includes("blog.html")) {
        watchAuthState(async (user) => {
            await loadBlogPosts(user);   // load blogs once

            // After blogs are loaded, run highlight logic
            const params = new URLSearchParams(window.location.search);
            const query = params.get("query");

            if (query) {
                const blogContainer = document.getElementById("blogContainer");
                const items = blogContainer.querySelectorAll(".media-item");

                let firstMatchSpan = null;

                items.forEach((item) => {
                    highlightMatches(item.querySelector(".media-title"), query);
                    highlightMatches(item.querySelector(".media-description"), query);
                    highlightMatches(item.querySelector("figcaption"), query);
                    highlightMatches(item.querySelector(".comments"), query);

                    if (!firstMatchSpan) {
                        firstMatchSpan = item.querySelector(".highlight-text");
                    }
                });

                if (firstMatchSpan) {
                    setTimeout(() => {
                        firstMatchSpan.scrollIntoView({behavior: "smooth", block: "center"});
                    }, 50);
                }
            }
        });
    }

    // ===== Admin Features =====
    watchAuthState((user) => {
        if (user) showAdminFeatures(user);
    });
    adminBlogUpload();
    adminUpload();

    // ===== Buttons =====
    const btn = document.getElementById("currentProjectBtn");
    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = "blog.html";
        });
    }

    // ===== Delegated Media Buttons =====
    const container = document.getElementById("mediaContainer");
    if (container) {
        container.addEventListener("click", async (e) => {
            const item = e.target.closest(".media-item");
            if (!item) return;
            const postId = item.dataset.id;

            // if (e.target.classList.contains("delete-btn")) {
            //     try {
            //         item.remove();
            //     } catch {
            //         alert("You don’t have permission to delete this post.");
            //     }
            // }

            if (e.target.classList.contains("edit-btn")) {
                console.log("Edit post:", postId);
                // TODO: open edit modal and call updatePost(postId, { ... })
            }

            if (e.target.classList.contains("pin-btn")) {
                try {
                    const currentlyPinned = item.dataset.pinned === "true";
                    const newPinned = await togglePin(postId, currentlyPinned);

                    item.dataset.pinned = newPinned ? "true" : "false";

                    const pinModal = document.getElementById("pinModal");
                    const pinMessage = document.getElementById("pinMessage");
                    const closeBtn = document.getElementById("closePinModal");

                    pinMessage.innerText =
                        `Post "${item.querySelector(".media-title").innerText}" has been ` +
                        `${newPinned ? "pinned" : "unpinned"}.`;

                    pinModal.style.display = "block";

                    closeBtn.onclick = () => {
                        pinModal.style.display = "none";
                    };

                    setTimeout(() => {
                        pinModal.style.display = "none";
                    }, 3000);
                } catch {
                    alert("You don’t have permission to change pin status.");
                }
            }
        });
    }

    // ===== Blog Form Guard =====
    const blogForm = document.getElementById("blogForm");
    if (blogForm) {
        blogForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await adminBlogUpload();
        });
    }

    // ===== Search Bar =====
    const searchInput = document.getElementById("searchBar");
    const searchBtn = document.getElementById("searchBtn");

    if (searchInput && searchBtn) {
        searchBtn.addEventListener("click", () => {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `blog.html?query=${encodeURIComponent(query)}`;
            }
        });
    }

    // ===== Help Modal =====
    const helpModal = document.getElementById("helpModal");
    const helpHeader = document.getElementById("helpHeader");
    const helpList = document.getElementById("helpList");
    const closeHelp = document.getElementById("closeHelp");

    const instructions = {
        media: {
            header: "Media Upload Instructions",
            steps: [
                "Required fields: Title and Link",
                "Add a short description of media link in the Content field (optional).",
                "For optional cover image: Go to GitHub → Images folder.",
                "Upload your image file there.",
                "Copy the GitHub image path (for example 'Images/projectBlog2025/...'.",
                "Paste image path into the Image field here.",
                "Click Upload Post."
            ],
        },
        contact: {
            header: "Contact Upload Instructions",
            steps: [
                "Required field: Name",
                "Enter the contact’s name.",
                "Optional: add a description.",
                "Paste a link if available (optional).",
                "Click Upload Contact Information."
            ],
        },
        blog: {
            header: "Blog Post Instructions",
            steps: [
                "Required fields: Title and Post Content",
                "For optional image(s): Go to GitHub → Images folder.",
                "Upload your blog image(s).",
                "If you have multiple images in a folder, drag and drop them into the Images folder as a folder (makes sub folder under Images).",
                "Copy the GitHub image path(s) seperated by spaces (for example 'Images/projectBlog2025/image1.jpg Images/projectBlog2025/image2.jpg'.",
                "Paste image path(s) into the Image field.",
                "Optional: add the date",
                "If there are multiple images in a post, reference in the Post Content with figure numbers (in order of the paths entered in Image field, for example, image1.jpg would be Figure 1 and image2.jpg would be Figure 2.",
                "Click Create Blog Post."
            ],
        },
    };

    document.querySelectorAll(".help-icon").forEach((icon) => {
        icon.addEventListener("click", () => {
            const type = icon.dataset.help;
            const info = instructions[type];
            if (!info) return;

            helpHeader.innerText = info.header;
            helpList.innerHTML = "";
            info.steps.forEach((step) => {
                const li = document.createElement("li");
                li.innerText = step;
                helpList.appendChild(li);
            });

            helpModal.classList.remove("hidden");
        });
    });

    if (closeHelp) {
        closeHelp.addEventListener("click", () => {
            helpModal.classList.add("hidden");
        });
    }

    if (helpModal) {
        helpModal.addEventListener("click", (e) => {
            if (e.target === helpModal) {
                helpModal.classList.add("hidden");
            }
        });
    }
});


