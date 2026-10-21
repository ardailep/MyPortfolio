// Profile page (/): contact links and latest posts.
(() => {
    const SITE = window.SITE;

    // ─────────────────────────────────────────
    // 1. CONTACT
    // ─────────────────────────────────────────
    const contactList = document.getElementById("contactList");

    // [label (translation key or plain text), href, shown text, external?]
    const contacts = () => {
        const list = [];
        const email = SITE.config.contactEmail;
        if (email) list.push(["contact.email", `mailto:${email}`, email, false]);
        list.push(
            ["X (Twitter)", "https://x.com/swaxilep", "@swaxilep", true],
            ["Instagram", "https://www.instagram.com/swaxilep/", "@swaxilep", true],
            ["contact.gallery", "https://www.instagram.com/teoartgallery0/", "@teoartgallery0", true],
            ["contact.portfolio", "https://www.artstation.com/swaxilep", "ArtStation", true],
            ["Discord", "https://discord.com/users/454979640306696192", "swaxilep", true],
            ["Roblox", "https://www.roblox.com/users/940248004/profile", "Swaxilep", true],
            ["contact.note", "/notes", SITE.t("contact.note.text"), false],
        );
        return list;
    };

    const renderContacts = () => {
        contactList.innerHTML = contacts().map(([label, href, text, external]) => `
            <li>
                <span>${SITE.escape(SITE.t(label))}</span>
                <a href="${SITE.escape(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${SITE.escape(text)}</a>
            </li>`).join("");
    };
    renderContacts();
    SITE.onLangChange(renderContacts);

    // ─────────────────────────────────────────
    // 2. LATEST POSTS
    // ─────────────────────────────────────────
    const activityList = document.getElementById("activityList");
    const activityStatus = document.getElementById("activityStatus");
    let posts = null;
    let statusKey = "posts.loading";

    const plain = (md) => md.replace(/[#*`>]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();

    const renderActivity = () => {
        activityStatus.hidden = Boolean(posts && posts.length);
        activityStatus.textContent = SITE.t(statusKey);
        if (!posts) return;
        activityList.innerHTML = posts.map(p => {
            const meta = [SITE.date(p.created_at)];
            if (SITE.parseTweet(p.link_url)) meta.push(SITE.t("post.tweet"));
            const excerpt = plain(p.body || "");
            return `<li><a href="/post?id=${p.id}">
                <p class="muted small">${SITE.escape(meta.join(" · "))}</p>
                <strong>${SITE.escape(SITE.posts.title(p))}</strong>
                ${excerpt && p.title ? `<p class="excerpt">${SITE.escape(excerpt)}</p>` : ""}
            </a></li>`;
        }).join("");
    };

    SITE.posts.list(3)
        .then(list => { posts = list; statusKey = "activity.empty"; })
        .catch(err => { console.error(err); posts = []; statusKey = SITE.posts.isMissingTable(err) ? "activity.empty" : "posts.error"; })
        .finally(renderActivity);
    SITE.onLangChange(renderActivity);
})();
