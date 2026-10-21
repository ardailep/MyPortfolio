// Blog posts: loading from Supabase and rendering LinkedIn-style post cards. Used by the profile, /blog and /post.
(() => {
    const SITE = window.SITE;
    const FIELDS = "id, title, body, image_url, published, created_at, updated_at";

    const list = async (limit = 100) => {
        if (!SITE.db) return [];
        const { data, error } = await SITE.db.from("posts").select(FIELDS)
            .eq("published", true)
            .order("created_at", { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data;
    };

    // Admins can also open their own drafts (RLS lets them read unpublished rows).
    const get = async (id) => {
        if (!SITE.db) return null;
        const { data, error } = await SITE.db.from("posts").select(FIELDS).eq("id", id).maybeSingle();
        if (error) throw error;
        return data;
    };

    const card = (post, { full = false } = {}) => {
        const el = document.createElement("article");
        el.className = "card post";
        const edited = post.updated_at && new Date(post.updated_at) - new Date(post.created_at) > 60000;
        const image = SITE.safeUrl(post.image_url);

        el.innerHTML = `
            <header class="post-head">
                <a href="/"><img class="avatar" src="shared/Profile.png" alt="" width="48" height="48"></a>
                <div>
                    <a href="/" class="post-author">Swaxilep</a>
                    <p class="muted small post-headline">${SITE.escape(SITE.t("profile.headline"))}</p>
                    <p class="muted small">
                        <a href="/post?id=${post.id}" class="post-time" title="${SITE.escape(SITE.date(post.created_at))}">${SITE.escape(SITE.ago(post.created_at))}</a>${edited ? ` · ${SITE.escape(SITE.t("post.edited"))}` : ""}
                        ${post.published ? "" : ` · <span class="badge">${SITE.escape(SITE.t("post.draft"))}</span>`}
                    </p>
                </div>
            </header>
            <h2 class="post-title">${full ? "" : `<a href="/post?id=${post.id}">`}${SITE.escape(post.title)}${full ? "" : "</a>"}</h2>
            <div class="post-body rich${full ? "" : " is-clamped"}">${SITE.richText(post.body)}</div>
            ${full ? "" : `<button type="button" class="link-btn post-more" hidden>${SITE.escape(SITE.t("post.more"))}</button>`}
            ${image ? `<a class="post-image" href="/post?id=${post.id}"><img src="${image}" alt="" loading="lazy" referrerpolicy="no-referrer"></a>` : ""}
            <footer class="post-actions">
                <button type="button" class="action-btn post-share">
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a3 3 0 1 1 4.2 4.2l-2 2-1.4-1.4 2-2a1 1 0 1 0-1.4-1.4L12 13.4a1 1 0 0 1-1.4 0Zm2.8-2.8a1 1 0 0 1 0 1.4l-3.5 3.5a3 3 0 1 1-4.2-4.2l2-2 1.4 1.4-2 2a1 1 0 1 0 1.4 1.4L12 10.6a1 1 0 0 1 1.4 0Z"/></svg>
                    <span>${SITE.escape(SITE.t("post.share"))}</span>
                </button>
            </footer>`;

        if (full && image) el.querySelector(".post-image").removeAttribute("href");

        // "…see more" only when the clamped text actually overflows.
        const body = el.querySelector(".post-body");
        const more = el.querySelector(".post-more");
        if (more) {
            requestAnimationFrame(() => { more.hidden = body.scrollHeight <= body.clientHeight + 2; });
            more.addEventListener("click", () => {
                const open = body.classList.toggle("is-clamped") === false;
                more.textContent = SITE.t(open ? "post.less" : "post.more");
            });
        }

        const share = el.querySelector(".post-share");
        share.addEventListener("click", async () => {
            const url = `${location.origin}/post?id=${post.id}`;
            try { await navigator.clipboard.writeText(url); } catch (e) { window.prompt("", url); return; }
            share.lastElementChild.textContent = SITE.t("post.copied");
            setTimeout(() => { share.lastElementChild.textContent = SITE.t("post.share"); }, 2000);
        });
        return el;
    };

    // True when the posts table hasn't been created yet (supabase-posts.sql not run).
    const isMissingTable = (err) => Boolean(err && ["42P01", "PGRST205", "PGRST200"].includes(err.code));

    SITE.posts = { list, get, card, isMissingTable };
})();
