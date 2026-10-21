// Profile page (/): contact info, profile views, latest posts, recent notes.
(() => {
    const SITE = window.SITE;

    // ─────────────────────────────────────────
    // 1. CONTACT INFO
    // ─────────────────────────────────────────
    const svg = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${path}</svg>`;
    const ICON = {
        site: svg('<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15.6 15.6 0 0 0-1.3-4A8 8 0 0 1 18.9 8ZM12 4.1c.8 1.1 1.5 2.4 1.9 3.9h-3.8c.4-1.5 1.1-2.8 1.9-3.9ZM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4H4.3Zm.8 2h3a15.6 15.6 0 0 0 1.3 4A8 8 0 0 1 5.1 16Zm3-8h-3a8 8 0 0 1 4.3-4 15.6 15.6 0 0 0-1.3 4ZM12 19.9c-.8-1.1-1.5-2.4-1.9-3.9h3.8c-.4 1.5-1.1 2.8-1.9 3.9Zm2.3-5.9H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4Zm.3 6c.6-1.2 1-2.6 1.3-4h3a8 8 0 0 1-4.3 4Zm1.7-6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4h-3.4Z"/>'),
        mail: svg('<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm9 7.6L4 7.3V17h16V7.3l-8 5.3ZM5.7 7l6.3 4.2L18.3 7H5.7Z"/>'),
        note: svg('<path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 5v2h10V8H7Zm0 4v2h7v-2H7Z"/>'),
        link: svg('<path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a3 3 0 1 1 4.2 4.2l-2 2-1.4-1.4 2-2a1 1 0 1 0-1.4-1.4L12 13.4a1 1 0 0 1-1.4 0Zm2.8-2.8a1 1 0 0 1 0 1.4l-3.5 3.5a3 3 0 1 1-4.2-4.2l2-2 1.4 1.4-2 2a1 1 0 1 0 1.4 1.4L12 10.6a1 1 0 0 1 1.4 0Z"/>'),
    };

    // [icon, label (translation key or plain text), href, shown text, external?]
    const contacts = () => {
        const list = [];
        const email = SITE.config.contactEmail;
        if (email) list.push(["mail", "contact.email", `mailto:${email}`, email]);
        list.push(
            ["note", "contact.note", "/notes", SITE.t("contact.note.text"), false],
            ["link", "contact.portfolio", "https://www.artstation.com/swaxilep", "ArtStation · swaxilep", true],
            ["link", "Instagram", "https://www.instagram.com/swaxilep/", "@swaxilep", true],
            ["link", "contact.gallery", "https://www.instagram.com/teoartgallery0/", "Instagram · @teoartgallery0", true],
            ["link", "Twitter / X", "https://x.com/swaxilep", "@swaxilep", true],
            ["link", "Discord", "https://discord.com/users/454979640306696192", "swaxilep", true],
            ["link", "Roblox", "https://www.roblox.com/users/940248004/profile", "Swaxilep", true],
        );
        return list;
    };

    const renderContacts = () => {
        document.querySelectorAll("[data-contact-list]").forEach(ul => {
            const items = contacts();
            if (ul.hasAttribute("data-with-site")) items.unshift(["site", "contact.profile", "https://swaxilep.com", "swaxilep.com", false]);
            ul.innerHTML = items.map(([ic, label, href, text, external]) => `
                <li>${ICON[ic]}<div>
                    <strong>${SITE.escape(SITE.t(label))}</strong>
                    <a href="${SITE.escape(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${SITE.escape(text)}</a>
                </div></li>`).join("");
        });
    };
    renderContacts();
    SITE.onLangChange(renderContacts);

    const dialog = document.getElementById("contactDialog");
    let opener = null;
    const openDialog = (e) => {
        e.preventDefault();
        opener = e.currentTarget;
        dialog.hidden = false;
        document.body.style.overflow = "hidden";
        document.getElementById("contactClose").focus();
    };
    const closeDialog = () => {
        dialog.hidden = true;
        document.body.style.overflow = "";
        if (opener) opener.focus();
    };
    document.getElementById("contactOpen").addEventListener("click", openDialog);
    document.getElementById("contactOpen2").addEventListener("click", openDialog);
    document.getElementById("contactClose").addEventListener("click", closeDialog);
    dialog.addEventListener("click", (e) => { if (e.target === dialog) closeDialog(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !dialog.hidden) closeDialog(); });

    // ─────────────────────────────────────────
    // 2. PROFILE VIEWS
    // ─────────────────────────────────────────
    const viewsEl = document.getElementById("views");
    let views = null;
    const renderViews = () => {
        if (views === null) return;
        viewsEl.innerHTML = `<a href="#activity">${SITE.escape(views === 1 ? SITE.t("profile.views.one") : SITE.t("profile.views", { n: SITE.number(views) }))}</a>`;
        viewsEl.hidden = false;
    };
    SITE.visitors.then(n => { views = n; renderViews(); });
    SITE.onLangChange(renderViews);

    // ─────────────────────────────────────────
    // 3. LATEST POSTS
    // ─────────────────────────────────────────
    const activityList = document.getElementById("activityList");
    const activityStatus = document.getElementById("activityStatus");
    let posts = null;
    let postsKey = "blog.loading";

    const plain = (md) => md.replace(/[#*`>]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();

    const renderActivity = () => {
        activityStatus.hidden = Boolean(posts && posts.length);
        activityStatus.textContent = SITE.t(postsKey);
        if (!posts) return;
        activityList.innerHTML = posts.map(p => {
            const image = SITE.safeUrl(p.image_url);
            return `<li><a href="/post?id=${p.id}">
                ${image ? `<img class="thumb" src="${image}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
                <div>
                    <p class="muted small">${SITE.escape(SITE.ago(p.created_at))}</p>
                    <strong>${SITE.escape(p.title)}</strong>
                    <p class="excerpt">${SITE.escape(plain(p.body))}</p>
                </div>
            </a></li>`;
        }).join("");
    };

    SITE.posts.list(3)
        .then(list => { posts = list; postsKey = "activity.empty"; })
        .catch(err => { console.error(err); posts = []; postsKey = SITE.posts.isMissingTable(err) ? "activity.empty" : "blog.error"; })
        .finally(renderActivity);
    SITE.onLangChange(renderActivity);

    // ─────────────────────────────────────────
    // 4. RECENT NOTES
    // ─────────────────────────────────────────
    const recentList = document.getElementById("recentNotes");
    const recentStatus = document.getElementById("recentStatus");
    let notes = null;
    let notesKey = "notes.loading";

    const renderNotes = () => {
        recentStatus.hidden = Boolean(notes && notes.length);
        recentStatus.textContent = SITE.t(notesKey);
        if (!notes) return;
        recentList.innerHTML = notes.map(n => `
            <li class="note">
                <span class="avatar avatar-sm avatar-letter" aria-hidden="true">${SITE.escape(SITE.initial(n.name))}</span>
                <div class="note-main">
                    <div class="note-bubble">
                        <span class="note-name">${SITE.escape(n.name)}</span>
                        <span class="muted small"> · ${SITE.escape(SITE.ago(n.created_at))}</span>
                        <p class="note-text">${SITE.escape(n.message.length > 140 ? `${n.message.slice(0, 140)}…` : n.message)}</p>
                    </div>
                </div>
            </li>`).join("");
    };

    if (SITE.db) {
        SITE.db.from("letters").select("id, name, message, created_at").order("created_at", { ascending: false }).limit(3)
            .then(({ data, error }) => {
                if (error) throw error;
                notes = data;
                notesKey = "notes.empty";
            })
            .catch(err => { console.error(err); notes = []; notesKey = "notes.error"; })
            .finally(renderNotes);
    } else {
        notes = [];
        notesKey = "notes.empty";
        renderNotes();
    }
    SITE.onLangChange(renderNotes);
})();
