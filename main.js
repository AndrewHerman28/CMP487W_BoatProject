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

    // Pin button
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

    // Edit button
    const editBtn = item.querySelector(".edit-btn");
    let isEditing = false;
    editBtn.addEventListener("click", async () => {
        if (!isEditing) {
            // Enter edit mode
            isEditing = true;
            editBtn.textContent = "✅";

            const titleEl = item.querySelector(".media-title");
            const dateEl = item.querySelector(".media-date");
            const descEl = item.querySelector(".media-description");
            const linkEl = item.querySelector("a");

            titleEl.outerHTML = `<input id="edit-title-${postId}" class="edit-input" value="${postData.title}">`;
            dateEl.outerHTML = `<input id="edit-date-${postId}" class="edit-input" value="${postData.date}">`;
            descEl.outerHTML = `<textarea id="edit-description-${postId}" class="edit-textarea">${postData.description ?? postData.content ?? ""}</textarea>`;
            linkEl.outerHTML = `<textarea id="edit-link-${postId}" class="edit-input">${postData.link}</textarea>`;

            const linkInputEl = item.querySelector(`#edit-link-${postId}`);
            linkInputEl.insertAdjacentHTML(
                "afterend",
                `<textarea id="edit-img-${postId}" class="edit-textarea">${postData.image}</textarea>`
            );
        } else {
            // Save edits
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
                link: newLink,
            };

            await updatePost(postId, updatedData);

            container.removeChild(item);
            renderPost(postId, updatedData, user);
        }
    });

    // Delete button
    const deleteBtn = item.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async () => {
        try {
            await deletePost(postId);
            container.removeChild(item);
            showToast(`Post "${postData.title}" deleted!`);
        } catch (err) {
            console.error("Failed to delete post:", err);
            showToast("Failed to delete post.");
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
    <p class="media-date">${postData.date ?? ""}</p>
    <a href="${postData.link ?? "#"}" target="_blank">`;

    // Single image
    if (postData.image) {
        item.innerHTML += `
      <figure>
        <img src="${postData.image}" alt="${postData.title}">
        <figcaption>Image</figcaption>
      </figure>`;
    }

    // Multiple images
    if (Array.isArray(postData.images)) {
        for (let i = 0; i < postData.images.length; i++) {
            item.innerHTML += `
        <figure>
          <img src="${postData.images[i]}" alt="Image ${i + 1}">
          <figcaption>Figure ${i + 1}</figcaption>
        </figure>`;
        }
    }

    item.innerHTML += `</a><br><p class="media-description">
    ${postData.description ?? postData.content ?? ""}
  </p>`;

    // Comment section
    const commentsEl = document.createElement("div");
    commentsEl.classList.add("comments");
    commentsEl.dataset.postId = postId;
    commentsEl.innerHTML = `
    <h4>Comments</h4>
    <div class="comment-list"></div>
    <form class="comment-form">
      <textarea placeholder="Write a comment..." required></textarea>
      <button type="submit">Post Comment</button>
    </form>`;
    item.appendChild(commentsEl);

    container.appendChild(item);

    // Pin button
    const pinBtn = item.querySelector(".pin-btn");
    pinBtn.addEventListener("click", async () => {
        const currentlyPinned = item.dataset.pinned === "true";
        const newPinned = await toggleBlogPin(postId, currentlyPinned);
        postData.pinned = newPinned;
        item.dataset.pinned = newPinned ? "true" : "false";

        container.removeChild(item);
        if (newPinned) {
            container.insertBefore(item, container.firstChild);
        } else {
            container.appendChild(item);
        }
        showToast(`Post "${postData.title}" ${newPinned ? "pinned" : "unpinned"}!`);
    });

    // Edit button
    const editBtn = item.querySelector(".edit-btn");
    let isEditing = false;
    editBtn.addEventListener("click", async () => {
        if (!isEditing) {
            isEditing = true;
            editBtn.textContent = "✅";

            const titleEl = item.querySelector(".media-title");
            const dateEl = item.querySelector(".media-date");
            const descEl = item.querySelector(".media-description");
            const imageList = Array.isArray(postData.images) ? postData.images.join("\n") : postData.image || "";

            titleEl.outerHTML = `<input id="edit-title-${postId}" class="edit-input" value="${postData.title}">`;
            dateEl.outerHTML = `<input id="edit-date-${postId}" class="edit-input" value="${postData.date ?? ""}">`;
            descEl.outerHTML = `<textarea id="edit-description-${postId}" class="edit-textarea">${postData.description ?? postData.content ?? ""}</textarea>`;

            const figures = item.querySelectorAll("figure");
            figures.forEach(fig => fig.remove());

            const linkEl = item.querySelector("a");
            linkEl.insertAdjacentHTML(
                "afterend",
                `<textarea id="edit-img-${postId}" class="edit-textarea">${imageList}</textarea>`
            );
        } else {
            isEditing = false;
            editBtn.textContent = "✏️";

            const newTitle = document.getElementById(`edit-title-${postId}`).value.trim();
            const newDate = document.getElementById(`edit-date-${postId}`).value.trim();
            const newDescription = document.getElementById(`edit-description-${postId}`).value.trim();
            const newImages = document.getElementById(`edit-img-${postId}`).value
                .split("\n")
                .map(url => url.trim())
                .filter(url => url !== "");

            const updatedData = {
                ...postData,
                title: newTitle,
                date: newDate,
                description: newDescription,
                images: newImages,
            };

            await updateBlogPost(postId, updatedData);

            container.removeChild(item);
            renderBlogPost(postId, updatedData, user);
        }
    });

    // Delete button
    const deleteBtn = item.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", async () => {
        try {
            await deleteBlogPost(postId);
            container.removeChild(item);
            showToast(`Post "${postData.title}" deleted!`);
        } catch (err) {
            console.error("Failed to delete post:", err);
            showToast("Failed to delete post.");
        }
    });

    // Render comments
    renderCommentSection(postId, user);
}

async function loadBlogPosts(user) {
    try {
        const container = document.getElementById("blogContainer");
        if (container) container.innerHTML = ""; // clear before rendering

        const snapshot = await getAllBlogPosts();
        const posts = [];
        snapshot.forEach(doc => posts.push({ id: doc.id, ...doc.data() }));

        // Sort pinned first, then by date (optional)
        posts.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            // secondary sort by date if you want
            return new Date(b.date) - new Date(a.date);
        });

        posts.forEach(post => renderBlogPost(post.id, post, user));

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
    const form = commentsEl.querySelector(".comment-form");
    const list = commentsEl.querySelector(".comment-list");

    if (form.dataset.listenrAttached !== "true") {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!user) {
                const loginModal = document.getElementById("loginModal");
                const closeBtn = document.getElementById("closeLoginModal");
                const goToLogin = document.getElementById("goToLogin");

                // Show modal (your CSS uses .show to flex-center)
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
        form.dataset.listenrAttached = "true"; // Prevent multiple listeners from being attached
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

function adminContactUpload() {
    const contactForm = document.getElementById("contactForm");
    if (!contactForm) return;

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("contact_name").value;
        const link = document.getElementById("contact_link").value;
        const des = document.getElementById("contact_des").value;

        try {
            await addContact({name, description: des, link});
            document.getElementById("contactMessage").innerText =
                "Contact uploaded successfully!";
            contactForm.reset();
        } catch (err) {
            console.error("Contact upload error:", err);
            document.getElementById("contactMessage").innerText =
                "Error uploading contact.";
        }
    });
}

function adminBlogUpload() {
    const blogForm = document.getElementById("blogForm");
    if (!blogForm) return;

    blogForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("titleInput").value;
        const des = document.getElementById("descInput").value;
        const date = document.getElementById("dateInput").value;
        const imageString = document.getElementById("imageInput").value;
        const images = imageString.split(" ");

        try {
            await createBlogPost({title, description: des, images, date});
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

async function adminUpload() {
    const mediaForm = document.getElementById("postForm");
    const contactForm = document.getElementById("contactForm");

    if (mediaForm) {
        mediaForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const postTitle = document.getElementById("post-header").value;
            const postLink = document.getElementById("post-link").value;
            const postDate = document.getElementById("post-date").value;
            const postContent = document.getElementById("post-content").value;
            const postImage = document.getElementById("post-img").value;

            const data = {
                title: postTitle,
                link: postLink,
                date: postDate,
                description: postContent,
                image: postImage,
            };

            try {
                await addDoc(collection(db, "mediaPosts"), data);
                showToast("Media post uploaded successfully!");
                mediaForm.reset();
            } catch (err) {
                console.error("Media upload error:", err);
                showToast("Error uploading media post.");
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const contactName = document.getElementById("contact_name").value;
            const contactDes = document.getElementById("contact_des").value;
            const contactLink = document.getElementById("contact_link").value;

            const data = {
                name: contactName,
                description: contactDes,
                link: contactLink,
            };

            try {
                await addDoc(collection(db, "contactInfo2025"), data);
                showToast("Contact uploaded successfully!");
                contactForm.reset();
            } catch (err) {
                console.error("Contact upload error:", err);
                showToast("Error uploading contact.");
            }
        });
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
    adminContactUpload();
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

            if (e.target.classList.contains("delete-btn")) {
                try {
                    await deletePost(postId);
                    item.remove();
                } catch {
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
            await handleNewBlogPost();
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

    closeHelp.addEventListener("click", () => {
        helpModal.classList.add("hidden");
    });

    helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add("hidden");
        }
    });
});


