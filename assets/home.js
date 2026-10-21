// Profile page (/): profile content from the database (edited in the admin panel) and the latest posts.
(() => {
    const SITE = window.SITE;
    const P = SITE.profile;
    const $ = (id) => document.getElementById(id);
    const esc = SITE.escape;

    // ─────────────────────────────────────────
    // 1. PROFILE
    // ─────────────────────────────────────────
    const page = $("profilePage");
    let profile = P.cached();

    const renderProfile = () => {
        if (!profile) return;
        const p = profile;
        const photo = SITE.safeUrl(p.photo) || (/^shared\/[\w.-]+$/.test(p.photo || "") ? p.photo : "shared/Profile.png");
        $("pPhoto").src = photo;
        $("pPhoto").alt = [p.realName, p.name].filter(Boolean).join(" · ");
        $("pName").textContent = p.name || "";
        $("pRealName").textContent = p.realName || "";
        $("pHeadline").textContent = P.pick(p.headline);
        $("pSub").textContent = P.pick(p.sub);
        $("pSub").hidden = !P.pick(p.sub);

        const about = P.pick(p.about).split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
        $("pAbout").innerHTML = about.map(par => `<p>${esc(par).replace(/\n/g, "<br>")}</p>`).join("");
        $("about").hidden = !about.length;

        const entries = (list, withText) => (list || []).filter(e => P.pick(e.title)).map(e => `
            <div class="entry">
                <h3>${esc(P.pick(e.title))}</h3>
                ${P.pick(e.sub) ? `<p class="muted">${esc(P.pick(e.sub))}</p>` : ""}
                ${withText && P.pick(e.text) ? `<p class="entry-text">${esc(P.pick(e.text))}</p>` : ""}
            </div>`).join("");
        $("pExperience").innerHTML = entries(p.experience, true);
        $("experience").hidden = !$("pExperience").children.length;
        $("pEducation").innerHTML = entries(p.education, true);
        $("education").hidden = !$("pEducation").children.length;

        const skills = (p.skills || []).map(P.pick).filter(Boolean);
        $("pSkills").innerHTML = skills.map(s => `<li>${esc(s)}</li>`).join("");
        $("skills").hidden = !skills.length;

        const contacts = (p.contacts || []).filter(c => P.href(c.url) && (P.pick(c.text) || P.pick(c.label)));
        $("contactList").innerHTML = contacts.map(c => {
            const href = P.href(c.url);
            const external = /^https?:/i.test(href);
            return `<li>
                <span>${esc(P.pick(c.label))}</span>
                <a href="${esc(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${esc(P.pick(c.text) || href.replace(/^(https?:\/\/|mailto:)/i, ""))}</a>
            </li>`;
        }).join("");
        $("contact").hidden = !contacts.length;
    };

    // Returning visitors see the cached copy straight away; first-time visitors wait (briefly) for the database.
    if (profile) renderProfile();
    else page.classList.add("is-loading");
    const reveal = () => page.classList.remove("is-loading");
    const giveUp = setTimeout(() => { if (!profile) { profile = P.merge(null); renderProfile(); } reveal(); }, 3000);

    P.load()
        .then(({ profile: fresh }) => { profile = fresh; })
        .catch(err => { console.error(err); if (!profile) profile = P.merge(null); })
        .finally(() => { clearTimeout(giveUp); renderProfile(); reveal(); });
    SITE.onLangChange(renderProfile);

    // ─────────────────────────────────────────
    // 2. LATEST POSTS
    // ─────────────────────────────────────────
    const activityList = $("activityList");
    const activityStatus = $("activityStatus");
    let posts = null;
    let statusKey = "posts.loading";

    // Each row shows the post's photo behind the text, fading out towards the top.
    const renderActivity = () => {
        activityStatus.hidden = Boolean(posts && posts.length);
        activityStatus.textContent = SITE.t(statusKey);
        if (!posts) return;
        activityList.innerHTML = posts.map(p => {
            const meta = [SITE.date(p.created_at)];
            if (SITE.parseTweet(p.link_url)) meta.push(SITE.t("post.tweet"));
            const excerpt = SITE.posts.plain(p.body);
            const image = SITE.safeUrl(p.image_url);
            return `<li><a href="/post?id=${p.id}" class="post-row${image ? " has-image" : ""}">
                ${image ? `<span class="row-bg" style="background-image:url('${esc(image)}')" aria-hidden="true"></span>` : ""}
                <span class="row-content">
                    <span class="post-meta">${p.pinned ? SITE.posts.pinBadge() : ""}<span>${esc(meta.join(" · "))}</span></span>
                    <strong>${esc(SITE.posts.title(p))}</strong>
                    ${excerpt && p.title ? `<span class="excerpt">${esc(excerpt)}</span>` : ""}
                </span>
            </a></li>`;
        }).join("");
    };

    SITE.posts.list(3)
        .then(list => { posts = list; statusKey = "activity.empty"; })
        .catch(err => { console.error(err); posts = []; statusKey = SITE.posts.isMissingTable(err) ? "activity.empty" : "posts.error"; })
        .finally(renderActivity);
    SITE.onLangChange(renderActivity);
})();
