// Notes (/notes): visitors leave one note each; replies are written in the admin panel.
// Stored in the Supabase "letters" table (supabase.sql + supabase-replies.sql).
(() => {
    const SITE = window.SITE;
    const db = SITE.db;
    const NAME_MAX = 40;
    const MESSAGE_MAX = 1000;
    const SENT_FLAG = "note-sent";
    const FIELDS = "id, user_id, name, message, created_at, reply, reply_gif, replied_at";

    const store = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ } };
    const load = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };

    const list = document.getElementById("noteList");
    const status = document.getElementById("noteStatus");
    const total = document.getElementById("noteTotal");
    const form = document.getElementById("noteForm");
    const sent = document.getElementById("noteSent");
    const nameInput = document.getElementById("noteName");
    const messageInput = document.getElementById("noteMessage");
    const count = document.getElementById("noteCount");
    const sendBtn = document.getElementById("noteSend");
    const errorEl = document.getElementById("noteError");

    let notes = [];
    let myId = null;
    let loaded = false;
    let statusKey = "notes.loading";
    let errorKey = null;

    // ─────────────────────────────────────────
    // 1. LIST
    // ─────────────────────────────────────────
    const noteHtml = (n) => {
        const mine = myId && n.user_id === myId;
        const gif = SITE.safeUrl(n.reply_gif);
        const reply = n.reply || gif ? `
            <div class="note-reply">
                <p class="note-head">
                    <span class="note-name">${SITE.escape(SITE.t("notes.reply"))}</span>
                    ${n.replied_at ? `<span class="muted small">${SITE.escape(SITE.ago(n.replied_at))}</span>` : ""}
                </p>
                ${n.reply ? `<p class="note-text">${SITE.escape(n.reply)}</p>` : ""}
                ${gif ? `<img class="note-gif" src="${gif}" alt="GIF" loading="lazy" referrerpolicy="no-referrer">` : ""}
            </div>` : "";

        return `
            <li class="note">
                <p class="note-head">
                    <span class="note-name">${SITE.escape(n.name)}</span>
                    ${mine ? `<span class="badge">${SITE.escape(SITE.t("notes.you"))}</span>` : ""}
                    <span class="muted small" title="${SITE.escape(SITE.date(n.created_at))}">${SITE.escape(SITE.ago(n.created_at))}</span>
                </p>
                <p class="note-text">${SITE.escape(n.message)}</p>
                ${reply}
            </li>`;
    };

    const render = () => {
        list.innerHTML = notes.map(noteHtml).join("");
        total.textContent = loaded && notes.length
            ? (notes.length === 1 ? SITE.t("notes.count.one") : SITE.t("notes.count", { n: SITE.number(notes.length) }))
            : SITE.t("notes.title");
        if (loaded && statusKey !== "notes.error") statusKey = notes.length ? null : "notes.empty";
        status.hidden = !statusKey;
        if (statusKey) status.textContent = SITE.t(statusKey);
    };

    const refreshForm = () => {
        // The database is the source of truth: if this visitor's note was deleted, they may write again.
        // The local flag only counts when the list couldn't be loaded.
        const hasNote = Boolean(myId) && notes.some(n => n.user_id === myId);
        const already = statusKey === "notes.error" ? load(SENT_FLAG) === "1" : hasNote;
        if (loaded && statusKey !== "notes.error" && !hasNote) store(SENT_FLAG, "0");
        form.hidden = already;
        sent.hidden = !already;
    };

    const loadNotes = async () => {
        if (!db) {
            statusKey = "notes.offline";
            sendBtn.disabled = true;
            render();
            return;
        }
        try {
            const [{ data, error }, user] = await Promise.all([
                db.from("letters").select(FIELDS).order("created_at", { ascending: false }).limit(500),
                SITE.user(),
            ]);
            if (error) throw error;
            notes = data;
            myId = user ? user.id : null;
            loaded = true;
        } catch (err) {
            console.error(err);
            statusKey = "notes.error";
        }
        render();
        refreshForm();
    };

    // ─────────────────────────────────────────
    // 2. WRITE
    // ─────────────────────────────────────────
    const showError = (key) => {
        errorKey = key;
        errorEl.hidden = !key;
        if (key) errorEl.textContent = SITE.t(key);
    };

    const updateCount = () => { count.textContent = `${messageInput.value.length} / ${MESSAGE_MAX}`; };
    messageInput.addEventListener("input", updateCount);
    updateCount();

    const setSending = (on) => {
        sendBtn.disabled = on;
        sendBtn.textContent = SITE.t(on ? "notes.sending" : "notes.send");
    };

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        showError(null);
        if (!db) return;

        const name = nameInput.value.trim().slice(0, NAME_MAX);
        const message = messageInput.value.trim().slice(0, MESSAGE_MAX);
        if (!name) { nameInput.focus(); return; }
        if (!message) { messageInput.focus(); return; }
        if (form.elements.website.value) return;   // honeypot filled → bot

        setSending(true);
        try {
            // An anonymous session is created only when someone actually posts a note.
            if (!(await SITE.user())) {
                const { error } = await db.auth.signInAnonymously();
                if (error) throw error;
            }
            const { data, error } = await db.from("letters").insert({ name, message }).select(FIELDS).single();
            if (error) {
                if (error.code === "23505") throw { code: "already" };   // unique(user_id) violated
                throw error;
            }
            store(SENT_FLAG, "1");
            myId = data.user_id;
            notes = [data, ...notes.filter(n => n.id !== data.id)];
            loaded = true;
            if (statusKey === "notes.error") statusKey = null;
            render();
            refreshForm();
        } catch (err) {
            if (err && err.code === "already") {
                store(SENT_FLAG, "1");
                form.hidden = true;
                sent.hidden = false;
            } else {
                console.error(err);
                showError("notes.error.generic");
            }
        } finally {
            setSending(false);
        }
    });

    SITE.onLangChange(() => {
        render();
        if (errorKey) showError(errorKey);
    });

    loadNotes();
})();
