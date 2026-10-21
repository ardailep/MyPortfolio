// Admin panel (/admin): write, edit and delete posts; reply to and delete notes.
// Only accounts listed in the Supabase "admins" table get in (supabase-replies.sql, supabase-posts.sql).
(() => {
    const SITE = window.SITE;
    const db = SITE.db;
    const BUCKET = "post-images";
    const POST_FIELDS = "id, title, body, image_url, published, created_at, updated_at";
    const NOTE_FIELDS = "id, name, message, created_at, reply, reply_gif, replied_at";
    const $ = (id) => document.getElementById(id);

    const statusEl = $("adminStatus");
    const loginCard = $("loginCard");
    const panel = $("panel");

    // Errors from Supabase come back in English; show them inside a translated sentence.
    const errText = (err) => SITE.t("admin.error", { msg: (err && (err.message || err.error_description)) || String(err) });

    // ─────────────────────────────────────────
    // 1. LOGIN
    // ─────────────────────────────────────────
    const showView = (admin) => {
        loginCard.hidden = admin;
        panel.hidden = !admin;
        const link = document.querySelector('.topnav [data-nav="admin"]');
        if (link) link.hidden = false;
        if (admin) { loadPosts(); loadNotes(); }
    };

    if (!db) {
        statusEl.hidden = false;
        statusEl.dataset.i18n = "admin.noconfig";
        statusEl.textContent = SITE.t("admin.noconfig");
        return;
    }

    SITE.isAdmin().then(showView);

    $("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const error = $("loginError");
        const submit = $("loginSubmit");
        error.hidden = true;
        submit.disabled = true;
        try {
            const { error: authError } = await db.auth.signInWithPassword({
                email: $("loginEmail").value.trim(),
                password: $("loginPassword").value,
            });
            if (authError) throw authError;
            if (!(await SITE.isAdmin(true))) {
                await db.auth.signOut();
                throw new Error("not admin");
            }
            $("loginPassword").value = "";
            showView(true);
        } catch (err) {
            console.error(err);
            error.textContent = SITE.t("admin.login.error");
            error.hidden = false;
        } finally {
            submit.disabled = false;
        }
    });

    $("logout").addEventListener("click", async () => {
        await db.auth.signOut();
        SITE.isAdmin(true);
        showView(false);
    });

    // ─────────────────────────────────────────
    // 2. TABS
    // ─────────────────────────────────────────
    const tabs = [[$("tabPosts"), $("postsPane")], [$("tabNotes"), $("notesPane")]];
    tabs.forEach(([tab]) => tab.addEventListener("click", () => {
        tabs.forEach(([t, pane]) => {
            t.setAttribute("aria-selected", String(t === tab));
            pane.hidden = t !== tab;
        });
    }));

    // ─────────────────────────────────────────
    // 3. POST EDITOR
    // ─────────────────────────────────────────
    const form = $("postForm");
    const titleInput = $("postTitle");
    const bodyInput = $("postBody");
    const imageInput = $("postImage");
    const fileInput = $("postFile");
    const preview = $("imagePreview");
    const removeImage = $("imageRemove");
    const published = $("postPublished");
    const saveBtn = $("postSave");
    const cancelBtn = $("postCancel");
    const postError = $("postError");
    const postOk = $("postOk");
    let editingId = null;
    let posts = [];

    const setError = (text) => { postError.textContent = text || ""; postError.hidden = !text; };
    const flashOk = (text) => {
        postOk.textContent = text;
        setTimeout(() => { if (postOk.textContent === text) postOk.textContent = ""; }, 3000);
    };

    const updateCount = () => { $("bodyCount").textContent = `${bodyInput.value.length} / 20000`; };
    bodyInput.addEventListener("input", updateCount);

    const showPreview = () => {
        const url = SITE.safeUrl(imageInput.value.trim());
        removeImage.hidden = !imageInput.value.trim();
        preview.hidden = !url;
        if (url) preview.src = url; else preview.removeAttribute("src");
    };
    imageInput.addEventListener("input", showPreview);
    preview.addEventListener("error", () => { preview.hidden = true; });
    removeImage.addEventListener("click", () => { imageInput.value = ""; showPreview(); });

    const resetForm = () => {
        editingId = null;
        form.reset();
        published.checked = true;
        $("formTitle").dataset.i18n = "admin.new";
        $("formTitle").textContent = SITE.t("admin.new");
        cancelBtn.hidden = true;
        setError(null);
        updateCount();
        showPreview();
    };

    const editPost = (post) => {
        editingId = post.id;
        titleInput.value = post.title;
        bodyInput.value = post.body;
        imageInput.value = post.image_url || "";
        published.checked = post.published;
        $("formTitle").dataset.i18n = "admin.editing";
        $("formTitle").textContent = SITE.t("admin.editing");
        cancelBtn.hidden = false;
        setError(null);
        updateCount();
        showPreview();
        form.scrollIntoView({ behavior: "smooth", block: "start" });
        titleInput.focus({ preventScroll: true });
    };
    cancelBtn.addEventListener("click", resetForm);

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        fileInput.value = "";
        if (!file) return;
        setError(null);
        if (file.size > 5 * 1024 * 1024) { setError(SITE.t("admin.upload.big")); return; }

        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        postOk.textContent = SITE.t("admin.uploading");
        saveBtn.disabled = true;
        try {
            const { error } = await db.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type });
            if (error) throw error;
            imageInput.value = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
            showPreview();
            postOk.textContent = "";
        } catch (err) {
            console.error(err);
            postOk.textContent = "";
            setError(SITE.t("admin.upload.error"));
        } finally {
            saveBtn.disabled = false;
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setError(null);
        const title = titleInput.value.trim().slice(0, 200);
        const image = imageInput.value.trim();
        if (!title) { setError(SITE.t("admin.title.required")); titleInput.focus(); return; }
        if (image && !SITE.safeUrl(image)) { setError(SITE.t("admin.image.bad")); imageInput.focus(); return; }

        const row = {
            title,
            body: bodyInput.value.trim().slice(0, 20000),
            image_url: image || null,
            published: published.checked,
        };

        saveBtn.disabled = true;
        saveBtn.textContent = SITE.t("admin.saving");
        try {
            const query = editingId === null
                ? db.from("posts").insert(row)
                : db.from("posts").update({ ...row, updated_at: new Date().toISOString() }).eq("id", editingId);
            const { data, error } = await query.select(POST_FIELDS);
            if (error) throw error;
            if (!data || !data.length) throw new Error("no row saved (are you still an admin?)");
            resetForm();
            flashOk(SITE.t("admin.saved"));
            await loadPosts();
        } catch (err) {
            console.error(err);
            setError(isMissingTable(err) ? SITE.t("admin.posts.missing") : errText(err));
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = SITE.t("admin.save");
        }
    });

    // ─────────────────────────────────────────
    // 4. POST LIST
    // ─────────────────────────────────────────
    const postList = $("postList");
    const postsStatus = $("postsStatus");
    const isMissingTable = (err) => Boolean(err && ["42P01", "PGRST205", "PGRST200"].includes(err.code));
    let postsStatusText = null;

    const setPostsStatus = (text) => {
        postsStatusText = text;
        postsStatus.hidden = !text;
        postsStatus.textContent = text || "";
    };

    const renderPosts = () => {
        postList.replaceChildren(...posts.map(post => {
            const li = document.createElement("li");
            li.innerHTML = `
                <div class="admin-row">
                    <div>
                        <strong></strong>
                        <p class="muted small">${SITE.escape(SITE.date(post.created_at))}
                            ${post.published ? "" : ` · <span class="badge">${SITE.escape(SITE.t("post.draft"))}</span>`}</p>
                    </div>
                    <div class="admin-actions">
                        <a class="btn btn-plain btn-sm" href="/post?id=${post.id}" target="_blank" rel="noopener">${SITE.escape(SITE.t("admin.view"))}</a>
                        <button type="button" class="btn btn-outline btn-sm" data-act="edit">${SITE.escape(SITE.t("admin.edit"))}</button>
                        <button type="button" class="btn btn-danger btn-sm" data-act="delete">${SITE.escape(SITE.t("admin.delete"))}</button>
                    </div>
                </div>`;
            li.querySelector("strong").textContent = post.title;
            li.querySelector('[data-act="edit"]').addEventListener("click", () => editPost(post));
            li.querySelector('[data-act="delete"]').addEventListener("click", async (e) => {
                const btn = e.currentTarget;
                if (!window.confirm(SITE.t("admin.delete.post"))) return;
                btn.disabled = true;
                const { data, error } = await db.from("posts").delete().eq("id", post.id).select("id");
                if (error || !data || !data.length) {
                    console.error(error);
                    btn.disabled = false;
                    window.alert(errText(error || "not deleted"));
                    return;
                }
                if (editingId === post.id) resetForm();
                posts = posts.filter(p => p.id !== post.id);
                renderPosts();
            });
            return li;
        }));
        if (!postsStatusText || postsStatusText === SITE.t("admin.posts.empty")) {
            setPostsStatus(posts.length ? null : SITE.t("admin.posts.empty"));
        }
    };

    async function loadPosts() {
        setPostsStatus(SITE.t("blog.loading"));
        const { data, error } = await db.from("posts").select(POST_FIELDS).order("created_at", { ascending: false });
        if (error) {
            console.error(error);
            posts = [];
            postList.replaceChildren();
            setPostsStatus(isMissingTable(error) ? SITE.t("admin.posts.missing") : errText(error));
            return;
        }
        posts = data;
        setPostsStatus(null);
        renderPosts();
    }

    // ─────────────────────────────────────────
    // 5. NOTES
    // ─────────────────────────────────────────
    const noteList = $("noteList");
    const notesStatus = $("notesStatus");
    let notes = [];

    const renderNotes = () => {
        notesStatus.hidden = notes.length > 0;
        notesStatus.textContent = SITE.t("admin.notes.empty");
        noteList.replaceChildren(...notes.map(note => {
            const li = document.createElement("li");
            li.className = "admin-note";
            li.innerHTML = `
                <div class="admin-row">
                    <div>
                        <strong class="js-name"></strong>
                        <span class="muted small"> · ${SITE.escape(SITE.date(note.created_at))}</span>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" data-act="delete">${SITE.escape(SITE.t("admin.delete"))}</button>
                </div>
                <p class="admin-note-text js-message"></p>
                <textarea class="input js-reply" maxlength="1000" rows="2" placeholder="${SITE.escape(SITE.t("admin.reply.ph"))}"></textarea>
                <input class="input js-gif" type="url" maxlength="500" placeholder="${SITE.escape(SITE.t("admin.gif.ph"))}">
                <div class="form-foot" style="margin-top:0">
                    <span class="form-ok js-status" role="status"></span>
                    <button type="button" class="btn btn-primary btn-sm" data-act="reply">${SITE.escape(SITE.t("admin.reply.save"))}</button>
                </div>`;
            li.querySelector(".js-name").textContent = note.name;
            li.querySelector(".js-message").textContent = note.message;
            const reply = li.querySelector(".js-reply");
            const gif = li.querySelector(".js-gif");
            const status = li.querySelector(".js-status");
            reply.value = note.reply || "";
            gif.value = note.reply_gif || "";

            li.querySelector('[data-act="reply"]').addEventListener("click", async (e) => {
                const btn = e.currentTarget;
                const text = reply.value.trim();
                // Giphy page links → direct GIF address.
                let gifUrl = gif.value.trim();
                const giphy = gifUrl.match(/^https?:\/\/(?:www\.)?giphy\.com\/(?:gifs|embed|stickers)\/(?:[\w-]*-)?([A-Za-z0-9]+)\/?(?:[?#].*)?$/);
                if (giphy) gifUrl = `https://media.giphy.com/media/${giphy[1]}/giphy.gif`;
                if (gifUrl && !SITE.safeUrl(gifUrl)) { status.className = "form-error js-status"; status.textContent = SITE.t("admin.image.bad"); return; }

                btn.disabled = true;
                status.className = "form-ok js-status";
                status.textContent = SITE.t("admin.saving");
                const { data, error } = await db.from("letters").update({
                    reply: text || null,
                    reply_gif: gifUrl || null,
                    replied_at: text || gifUrl ? new Date().toISOString() : null,
                }).eq("id", note.id).select(NOTE_FIELDS);
                btn.disabled = false;
                if (error || !data || !data.length) {
                    console.error(error);
                    status.className = "form-error js-status";
                    status.textContent = errText(error || "not saved");
                    return;
                }
                Object.assign(note, data[0]);
                gif.value = note.reply_gif || "";
                status.textContent = SITE.t("admin.saved");
            });

            li.querySelector('[data-act="delete"]').addEventListener("click", async (e) => {
                const btn = e.currentTarget;
                if (!window.confirm(SITE.t("admin.delete.note"))) return;
                btn.disabled = true;
                const { data, error } = await db.from("letters").delete().eq("id", note.id).select("id");
                if (error || !data || !data.length) {
                    console.error(error);
                    btn.disabled = false;
                    window.alert(errText(error || "not deleted"));
                    return;
                }
                notes = notes.filter(n => n.id !== note.id);
                renderNotes();
            });
            return li;
        }));
    };

    async function loadNotes() {
        notesStatus.hidden = false;
        notesStatus.textContent = SITE.t("notes.loading");
        const { data, error } = await db.from("letters").select(NOTE_FIELDS).order("created_at", { ascending: false }).limit(500);
        if (error) {
            console.error(error);
            notesStatus.textContent = errText(error);
            return;
        }
        notes = data;
        renderNotes();
    }

    SITE.onLangChange(() => {
        if (panel.hidden) return;
        renderPosts();
        renderNotes();
        saveBtn.textContent = SITE.t("admin.save");
    });
    updateCount();
})();
