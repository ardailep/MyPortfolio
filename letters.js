// Letter wall (letters.html). Uses Supabase when letters-config.js is filled in, otherwise a local demo store.
(() => {
    const SITE = window.SITE;
    const config = window.LETTERS_CONFIG || {};
    const NAME_MAX = 40;
    const MESSAGE_MAX = 1000;
    const SENT_FLAG = "letter-sent";
    const BASE_FIELDS = "id, user_id, name, message, created_at, reply, replied_at";
    const FIELDS = `${BASE_FIELDS}, reply_gif`;

    const store = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ } };
    const load = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };

    // ─────────────────────────────────────────
    // 1. BACKENDS
    // ─────────────────────────────────────────
    // Each backend: list() → letters newest first, myId() → current user id (or null),
    // send(name, message) → saved letter (throws { code: "already" } on a second letter),
    // isAdmin(), login(email, password), logout(), reply(id, text, gif) → updated letter, remove(id).

    const supabaseBackend = () => {
        const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: { persistSession: true, autoRefreshToken: true },
        });

        // Until supabase-replies.sql is re-run the reply_gif column doesn't exist; fall back to the old columns.
        let fields = FIELDS;
        const withFields = async (run) => {
            let res = await run(fields);
            if (res.error && ["42703", "PGRST204"].includes(res.error.code) && fields !== BASE_FIELDS) {
                fields = BASE_FIELDS;
                res = await run(fields);
            }
            return res;
        };

        const currentUser = async () => {
            const { data } = await client.auth.getSession();
            return data.session ? data.session.user : null;
        };

        const checkAdmin = async () => {
            const user = await currentUser();
            if (!user || user.is_anonymous) return false;
            const { data } = await client.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
            return Boolean(data);
        };

        return {
            async list() {
                const { data, error } = await withFields(f => client
                    .from("letters")
                    .select(f)
                    .order("created_at", { ascending: false })
                    .limit(500));
                if (error) throw error;
                return data;
            },
            async myId() {
                const user = await currentUser();
                return user ? user.id : null;
            },
            async send(name, message) {
                // An anonymous session is created only when someone actually sends a letter.
                if (!(await currentUser())) {
                    const { error } = await client.auth.signInAnonymously();
                    if (error) throw error;
                }
                const { data, error } = await withFields(f => client
                    .from("letters")
                    .insert({ name, message })
                    .select(f)
                    .single());
                if (error) {
                    if (error.code === "23505") throw { code: "already" };   // unique(user_id) violated
                    throw error;
                }
                return data;
            },
            isAdmin: checkAdmin,
            async login(email, password) {
                const { error } = await client.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (!(await checkAdmin())) {
                    await client.auth.signOut();
                    throw { code: "not-admin" };
                }
            },
            async logout() {
                await client.auth.signOut();
            },
            async reply(id, text, gif) {
                const { data, error } = await withFields(f => {
                    const changes = { reply: text || null, replied_at: text || gif ? new Date().toISOString() : null };
                    if (f.includes("reply_gif")) changes.reply_gif = gif || null;
                    return client.from("letters").update(changes).eq("id", id).select(f).single();
                });
                if (error) throw error;
                // Text is saved, but the GIF can't be until the reply_gif column exists.
                if (gif && !fields.includes("reply_gif")) return { ...data, gifNotSaved: true };
                return data;
            },
            async remove(id) {
                // Without the delete policy RLS silently deletes nothing, so check that a row came back.
                const { data, error } = await client.from("letters").delete().eq("id", id).select("id");
                if (error) throw error;
                if (!data || !data.length) throw { code: "not-deleted" };
            },
        };
    };

    const demoBackend = () => {
        const KEY = "letters-demo";
        const ADMIN = "letters-demo-admin";
        const ME = "demo-visitor";
        const read = () => { try { return JSON.parse(load(KEY)) || []; } catch (e) { return []; } };
        const write = (letters) => store(KEY, JSON.stringify(letters));

        return {
            async list() { return read(); },
            async myId() { return ME; },
            async send(name, message) {
                const letters = read();
                if (letters.some(l => l.user_id === ME)) throw { code: "already" };
                const letter = { id: Date.now(), user_id: ME, name, message, created_at: new Date().toISOString(), reply: null, replied_at: null };
                write([letter, ...letters]);
                return letter;
            },
            async isAdmin() { return load(ADMIN) === "1"; },
            async login() { store(ADMIN, "1"); },
            async logout() { store(ADMIN, "0"); },
            async reply(id, text, gif) {
                const letters = read();
                const letter = letters.find(l => l.id === id);
                letter.reply = text || null;
                letter.reply_gif = gif || null;
                letter.replied_at = text || gif ? new Date().toISOString() : null;
                write(letters);
                return letter;
            },
            async remove(id) { write(read().filter(l => l.id !== id)); },
        };
    };

    const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
    const api = hasSupabase ? supabaseBackend() : demoBackend();
    document.getElementById("demoNote").hidden = hasSupabase;

    // ─────────────────────────────────────────
    // 2. WALL
    // ─────────────────────────────────────────
    const grid = document.getElementById("wall-grid");
    const status = document.getElementById("wallStatus");
    const total = document.getElementById("letterTotal");

    const tones = [
        { front: "#efe2cf", back: "#d6c2a6", flap: "#f7eddf" },   // cream
        { front: "#f2c9a5", back: "#d9a77f", flap: "#f8dbc1" },   // peach
        { front: "#e8bcc4", back: "#cc9aa5", flap: "#f2d0d6" },   // rose
        { front: "#e6d3a3", back: "#c9b47f", flap: "#f0e2bd" },   // sand
        { front: "#cfd6bd", back: "#adb797", flap: "#dfe4d0" },   // sage
    ];

    // Stable pseudo-random numbers per letter, so the wall looks the same on every visit.
    const hash = (value) => {
        let h = 2166136261;
        for (const ch of String(value)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
        return (h >>> 0) / 4294967295;
    };

    function formatDate(iso, month = "long") {
        return new Intl.DateTimeFormat(SITE.lang === "tr" ? "tr-TR" : "en-GB", {
            day: "numeric", month, year: "numeric",
        }).format(new Date(iso));
    }

    let letters = [];
    let myId = null;
    let isAdmin = false;
    let statusKey = "letters.wall.loading";

    const setStatus = (key) => {
        statusKey = key;
        status.hidden = !key;
        if (key) status.textContent = SITE.t(key);
    };

    const envelopeFor = (letter) => {
        const r = hash(letter.id);
        const tone = tones[Math.floor(hash(`${letter.id}-tone`) * tones.length)];
        const mine = myId && letter.user_id === myId;

        const li = document.createElement("li");
        li.className = "reveal";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "envelope" + (mine ? " is-mine" : "");
        btn.style.setProperty("--rot", `${(r - 0.5) * 12}deg`);
        btn.style.setProperty("--dy", `${(hash(`${letter.id}-y`) - 0.5) * 18}px`);
        btn.style.setProperty("--front", tone.front);
        btn.style.setProperty("--back", tone.back);
        btn.style.setProperty("--flap", tone.flap);
        btn.setAttribute("aria-label", `${SITE.t("letters.from")}: ${letter.name}, ${formatDate(letter.created_at)}`);

        btn.innerHTML = `
            <span class="env-paper" aria-hidden="true"></span>
            <span class="env-front" aria-hidden="true"></span>
            <span class="env-flap" aria-hidden="true"></span>
            <span class="env-seal" aria-hidden="true">✦</span>
            <span class="env-name" aria-hidden="true"></span>
            <span class="env-date" aria-hidden="true"></span>`;
        btn.querySelector(".env-name").textContent = letter.name;

        const tags = [formatDate(letter.created_at, "short")];
        if (mine) tags.push(SITE.t("letters.yours"));
        if (letter.reply || letter.reply_gif) tags.push(`${SITE.t("letters.replied")} ✓`);
        btn.querySelector(".env-date").textContent = tags.join(" · ");

        btn.addEventListener("click", () => openLetter(letter.id, btn));
        li.appendChild(btn);
        return li;
    };

    const renderWall = () => {
        grid.replaceChildren(...letters.map(envelopeFor));
        total.textContent = String(letters.length).padStart(2, "0");
        if (statusKey !== "letters.wall.error") setStatus(letters.length ? null : "letters.wall.empty");
        SITE.reveal(grid);
    };

    const loadWall = async () => {
        setStatus("letters.wall.loading");
        try {
            [letters, myId, isAdmin] = await Promise.all([api.list(), api.myId(), api.isAdmin()]);
            renderWall();
        } catch (err) {
            console.error(err);
            setStatus("letters.wall.error");
        }
        refreshComposeState();
        refreshAdminState();
    };

    // ─────────────────────────────────────────
    // 3. OPENED LETTER (+ reply)
    // ─────────────────────────────────────────
    const modal = document.getElementById("letterModal");
    const modalFrom = document.getElementById("letterFrom");
    const modalDate = document.getElementById("letterDate");
    const modalBody = document.getElementById("letterBody");
    const modalClose = document.getElementById("letterClose");
    const replyBox = document.getElementById("letterReply");
    const replyBody = document.getElementById("letterReplyBody");
    const replyForm = document.getElementById("replyForm");
    const replyText = document.getElementById("replyText");
    const replySave = document.getElementById("replySave");
    const replyStatus = document.getElementById("replyStatus");
    const replyGifShown = document.getElementById("letterReplyGif");
    const replyGif = document.getElementById("replyGif");
    const replyGifClear = document.getElementById("replyGifClear");
    const replyGifPreview = document.getElementById("replyGifPreview");
    let openFrom = null;
    let openId = null;
    let gifOk = true;

    // Turn a Giphy page link (giphy.com/gifs/name-ID, giphy.com/embed/ID) into its direct GIF address.
    const normalizeGif = (value) => {
        const url = value.trim();
        if (!url) return "";
        const giphy = url.match(/^https?:\/\/(?:www\.)?giphy\.com\/(?:gifs|embed|stickers)\/(?:[\w-]*-)?([A-Za-z0-9]+)\/?(?:[?#].*)?$/);
        if (giphy) return `https://media.giphy.com/media/${giphy[1]}/giphy.gif`;
        return url.replace(/^http:\/\//, "https://");
    };

    const showGifPreview = () => {
        const url = normalizeGif(replyGif.value);
        replyGifClear.hidden = !url;
        replyStatus.textContent = "";
        gifOk = !url;
        if (!url) { replyGifPreview.hidden = true; replyGifPreview.removeAttribute("src"); return; }
        replyGifPreview.onload = () => { gifOk = true; replyGifPreview.hidden = false; };
        replyGifPreview.onerror = () => {
            gifOk = false;
            replyGifPreview.hidden = true;
            replyStatus.textContent = SITE.t("letters.reply.gif.bad");
        };
        replyGifPreview.src = url;
    };

    replyGif.addEventListener("input", showGifPreview);
    replyGifClear.addEventListener("click", () => { replyGif.value = ""; showGifPreview(); replyGif.focus(); });

    const openLetterData = () => letters.find(l => l.id === openId);

    const fillLetter = () => {
        const letter = openLetterData();
        if (!letter) return;
        modalFrom.textContent = letter.name;
        modalBody.textContent = letter.message;
        modalDate.textContent = formatDate(letter.created_at);
        modalClose.setAttribute("aria-label", SITE.t("letters.close"));

        replyBox.hidden = !(letter.reply || letter.reply_gif);
        replyBody.textContent = letter.reply || "";
        replyBody.hidden = !letter.reply;
        replyGifShown.hidden = !letter.reply_gif;
        if (letter.reply_gif) replyGifShown.src = letter.reply_gif;
        else replyGifShown.removeAttribute("src");
        replyForm.hidden = !isAdmin;
    };

    function openLetter(id, trigger) {
        openId = id;
        openFrom = trigger;
        fillLetter();
        const letter = openLetterData();
        replyText.value = (letter && letter.reply) || "";
        replyGif.value = (letter && letter.reply_gif) || "";
        showGifPreview();
        disarmDelete();
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        modalClose.focus();
    }

    const closeLetter = () => {
        modal.hidden = true;
        document.body.style.overflow = "";
        openId = null;
        if (openFrom) openFrom.focus();
    };

    modalClose.addEventListener("click", closeLetter);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeLetter(); });
    document.addEventListener("keydown", (e) => {
        if (modal.hidden) return;
        if (e.key === "Escape") closeLetter();
        if (e.key === "Tab") {
            // keep focus inside the dialog
            const focusables = Array.from(modal.querySelectorAll("button, textarea"))
                .filter(el => !el.closest("[hidden]"));
            const first = focusables[0], last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    replyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!isAdmin || openId === null) return;
        const gif = normalizeGif(replyGif.value);
        if (gif && !gifOk) { replyStatus.textContent = SITE.t("letters.reply.gif.bad"); replyGif.focus(); return; }
        replySave.disabled = true;
        replyStatus.textContent = SITE.t("letters.reply.saving");
        try {
            const updated = await api.reply(openId, replyText.value.trim().slice(0, MESSAGE_MAX), gif.slice(0, 500));
            letters = letters.map(l => (l.id === updated.id ? updated : l));
            renderWall();
            fillLetter();
            replyStatus.textContent = SITE.t(updated.gifNotSaved ? "letters.reply.gif.nocolumn" : "letters.reply.saved");
        } catch (err) {
            console.error(err);
            replyStatus.textContent = SITE.t("letters.error.generic");
        } finally {
            replySave.disabled = false;
        }
    });

    // Delete: first tap arms the button, a second tap within 4 s deletes.
    const deleteBtn = document.getElementById("letterDelete");
    let deleteArmed = null;

    const disarmDelete = () => {
        clearTimeout(deleteArmed);
        deleteArmed = null;
        deleteBtn.classList.remove("is-armed");
        deleteBtn.firstElementChild.textContent = SITE.t("letters.delete");
    };

    deleteBtn.addEventListener("click", async () => {
        if (!isAdmin || openId === null) return;
        if (!deleteArmed) {
            deleteBtn.classList.add("is-armed");
            deleteBtn.firstElementChild.textContent = SITE.t("letters.delete.confirm");
            deleteArmed = setTimeout(disarmDelete, 4000);
            return;
        }
        disarmDelete();
        deleteBtn.disabled = true;
        try {
            const id = openId;
            await api.remove(id);
            letters = letters.filter(l => l.id !== id);
            openFrom = null;   // its envelope is gone
            closeLetter();
            renderWall();
        } catch (err) {
            console.error(err);
            replyStatus.textContent = SITE.t("letters.delete.failed");
        } finally {
            deleteBtn.disabled = false;
        }
    });

    // ─────────────────────────────────────────
    // 4. ADMIN LOGIN (hidden: /letters?admin)
    // ─────────────────────────────────────────
    const adminBar = document.getElementById("adminBar");
    const adminLogin = document.getElementById("adminLogin");
    const adminOn = document.getElementById("adminOn");
    const adminError = document.getElementById("adminError");
    const adminSubmit = document.getElementById("adminSubmit");
    const wantsAdmin = new URLSearchParams(location.search).has("admin");

    function refreshAdminState() {
        adminBar.hidden = !(isAdmin || wantsAdmin);
        adminLogin.hidden = isAdmin;
        adminOn.hidden = !isAdmin;
    }

    adminLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        adminError.hidden = true;
        adminSubmit.disabled = true;
        try {
            await api.login(document.getElementById("adminEmail").value.trim(), document.getElementById("adminPassword").value);
            document.getElementById("adminPassword").value = "";
            await loadWall();
        } catch (err) {
            console.error(err);
            adminError.textContent = SITE.t("letters.admin.error");
            adminError.hidden = false;
        } finally {
            adminSubmit.disabled = false;
        }
    });

    document.getElementById("adminLogout").addEventListener("click", async () => {
        await api.logout();
        await loadWall();
    });

    // ─────────────────────────────────────────
    // 5. COMPOSE
    // ─────────────────────────────────────────
    const form = document.getElementById("letterForm");
    const sentCard = document.getElementById("sentCard");
    const nameInput = document.getElementById("letterName");
    const messageInput = document.getElementById("letterMessage");
    const count = document.getElementById("letterCount");
    const sendBtn = document.getElementById("letterSend");
    const errorEl = document.getElementById("formError");
    let errorKey = null;

    const showError = (key) => {
        errorKey = key;
        errorEl.hidden = !key;
        if (key) errorEl.textContent = SITE.t(key);
    };

    const updateCount = () => { count.textContent = `${messageInput.value.length} / ${MESSAGE_MAX}`; };
    messageInput.addEventListener("input", updateCount);
    updateCount();

    function refreshComposeState() {
        const alreadySent = load(SENT_FLAG) === "1" || letters.some(l => myId && l.user_id === myId);
        form.hidden = alreadySent;
        sentCard.hidden = !alreadySent;
    }

    const setSending = (sending) => {
        sendBtn.disabled = sending;
        sendBtn.firstElementChild.textContent = SITE.t(sending ? "letters.form.sending" : "letters.form.send");
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        showError(null);

        const name = nameInput.value.trim().slice(0, NAME_MAX);
        const message = messageInput.value.trim().slice(0, MESSAGE_MAX);
        if (!name) { nameInput.focus(); return; }
        if (!message) { messageInput.focus(); return; }
        if (form.elements.website.value) return;   // honeypot filled → bot

        setSending(true);
        try {
            const letter = await api.send(name, message);
            store(SENT_FLAG, "1");
            myId = letter.user_id;
            letters = [letter, ...letters.filter(l => l.id !== letter.id)];
            setStatus(null);
            renderWall();
            refreshComposeState();
            const mine = grid.querySelector(".envelope.is-mine");
            if (mine) mine.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (err) {
            if (err && err.code === "already") {
                store(SENT_FLAG, "1");
                refreshComposeState();
            } else {
                console.error(err);
                showError("letters.error.generic");
            }
        } finally {
            setSending(false);
        }
    });

    // Re-render language-dependent bits that aren't driven by data-i18n.
    SITE.onLangChange(() => {
        if (statusKey) setStatus(statusKey);
        if (errorKey) showError(errorKey);
        if (letters.length) renderWall();
        fillLetter();
    });

    loadWall();
})();
