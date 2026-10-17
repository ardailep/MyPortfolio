// Letter wall (letters.html). Uses Supabase when letters-config.js is filled in, otherwise a local demo store.
(() => {
    const SITE = window.SITE;
    const config = window.LETTERS_CONFIG || {};
    const NAME_MAX = 40;
    const MESSAGE_MAX = 1000;
    const SENT_FLAG = "letter-sent";

    const store = (key, value) => { try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ } };
    const load = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };

    // ─────────────────────────────────────────
    // 1. BACKENDS
    // ─────────────────────────────────────────
    // Each backend: list() → letters newest first, myId() → id of this visitor's letter owner (or null),
    // send(name, message) → the saved letter. send() throws { code: "already" } for a second letter.

    const supabaseBackend = () => {
        const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: { persistSession: true, autoRefreshToken: true },
        });

        const currentUserId = async () => {
            const { data } = await client.auth.getSession();
            return data.session ? data.session.user.id : null;
        };

        return {
            async list() {
                const { data, error } = await client
                    .from("letters")
                    .select("id, user_id, name, message, created_at")
                    .order("created_at", { ascending: false })
                    .limit(500);
                if (error) throw error;
                return data;
            },
            myId: currentUserId,
            async send(name, message) {
                // An anonymous session is created only when someone actually sends a letter.
                if (!(await currentUserId())) {
                    const { error } = await client.auth.signInAnonymously();
                    if (error) throw error;
                }
                const { data, error } = await client
                    .from("letters")
                    .insert({ name, message })
                    .select("id, user_id, name, message, created_at")
                    .single();
                if (error) {
                    if (error.code === "23505") throw { code: "already" };   // unique(user_id) violated
                    throw error;
                }
                return data;
            },
        };
    };

    const demoBackend = () => {
        const KEY = "letters-demo";
        const ME = "demo-visitor";
        const read = () => { try { return JSON.parse(load(KEY)) || []; } catch (e) { return []; } };

        return {
            async list() { return read(); },
            async myId() { return ME; },
            async send(name, message) {
                const letters = read();
                if (letters.some(l => l.user_id === ME)) throw { code: "already" };
                const letter = { id: Date.now(), user_id: ME, name, message, created_at: new Date().toISOString() };
                store(KEY, JSON.stringify([letter, ...letters]));
                return letter;
            },
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
    let statusKey = "letters.wall.loading";

    const setStatus = (key) => {
        statusKey = key;
        status.hidden = !key;
        if (key) status.textContent = SITE.t(key);
    };

    const envelopeFor = (letter, index) => {
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
        btn.dataset.index = index;

        btn.innerHTML = `
            <span class="env-paper" aria-hidden="true"></span>
            <span class="env-front" aria-hidden="true"></span>
            <span class="env-flap" aria-hidden="true"></span>
            <span class="env-seal" aria-hidden="true">✦</span>
            <span class="env-name" aria-hidden="true"></span>
            <span class="env-date" aria-hidden="true"></span>`;
        btn.querySelector(".env-name").textContent = letter.name;
        btn.querySelector(".env-date").textContent =
            formatDate(letter.created_at, "short") + (mine ? ` · ${SITE.t("letters.yours")}` : "");

        btn.addEventListener("click", () => openLetter(letter, btn));
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
            [letters, myId] = await Promise.all([api.list(), api.myId()]);
            renderWall();
        } catch (err) {
            console.error(err);
            setStatus("letters.wall.error");
        }
        refreshComposeState();
    };

    // ─────────────────────────────────────────
    // 3. OPENED LETTER
    // ─────────────────────────────────────────
    const modal = document.getElementById("letterModal");
    const modalFrom = document.getElementById("letterFrom");
    const modalDate = document.getElementById("letterDate");
    const modalBody = document.getElementById("letterBody");
    const modalClose = document.getElementById("letterClose");
    let openFrom = null;
    let openLetterData = null;


    const fillLetter = () => {
        if (!openLetterData) return;
        modalFrom.textContent = openLetterData.name;
        modalBody.textContent = openLetterData.message;
        modalDate.textContent = formatDate(openLetterData.created_at);
        modalClose.setAttribute("aria-label", SITE.t("letters.close"));
    };

    function openLetter(letter, trigger) {
        openLetterData = letter;
        openFrom = trigger;
        fillLetter();
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        modalClose.focus();
    }

    const closeLetter = () => {
        modal.hidden = true;
        document.body.style.overflow = "";
        openLetterData = null;
        if (openFrom) openFrom.focus();
    };

    modalClose.addEventListener("click", closeLetter);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeLetter(); });
    document.addEventListener("keydown", (e) => {
        if (modal.hidden) return;
        if (e.key === "Escape") closeLetter();
        if (e.key === "Tab") { e.preventDefault(); modalClose.focus(); }   // only one focusable element
    });

    // ─────────────────────────────────────────
    // 4. COMPOSE
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
