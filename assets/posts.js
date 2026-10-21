// Posts: loading from Supabase and rendering them (text, image and/or an embedded X post). Used by /, /posts and /post.
(() => {
    const SITE = window.SITE;
    const FIELDS = "id, title, body, image_url, link_url, published, created_at, updated_at";

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

    const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; } };

    // Posts may have no title (e.g. a shared X post): fall back to the first line of text.
    const title = (post) => {
        if (post.title) return post.title;
        const first = (post.body || "").replace(/[#*`>]/g, "").split("\n").map(s => s.trim()).find(Boolean);
        if (first) return first.length > 80 ? `${first.slice(0, 80)}…` : first;
        if (SITE.parseTweet(post.link_url)) return SITE.t("post.tweet.title");
        return post.link_url ? hostOf(post.link_url) : "—";
    };

    // X's embed script turns <blockquote class="twitter-tweet"> into the real post. Loaded once, only when needed.
    let widgets = null;
    const loadWidgets = () => {
        if (!widgets) {
            widgets = new Promise((resolve, reject) => {
                const s = document.createElement("script");
                s.src = "https://platform.twitter.com/widgets.js";
                s.async = true;
                s.charset = "utf-8";
                s.onload = () => resolve(window.twttr);
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        return widgets;
    };
    const embedTweets = (root) => {
        const boxes = root.querySelectorAll(".post-tweet[data-tweet-id]");
        if (!boxes.length) return;
        loadWidgets().then(twttr => twttr.ready(() => boxes.forEach(box => {
            twttr.widgets.createTweet(box.dataset.tweetId, box, { dnt: true, theme: "light", lang: SITE.lang, conversation: "none" })
                .then(node => { if (node) box.querySelector(".tweet-fallback").remove(); });
        }))).catch(() => { /* fallback link stays */ });
    };

    // X post links are embedded; any other link shows as a simple card.
    const linkHtml = (url) => {
        const tweet = SITE.parseTweet(url);
        if (!tweet) {
            const href = SITE.httpUrl(url);
            if (!href) return "";
            return `<a class="link-card" href="${SITE.escape(href)}" target="_blank" rel="noopener">
                <strong>${SITE.escape(hostOf(href))} ↗</strong>
                <span>${SITE.escape(href.replace(/^https?:\/\//, ""))}</span>
            </a>`;
        }
        const href = `https://twitter.com/${tweet.user}/status/${tweet.id}`;
        return `<div class="post-tweet" data-tweet-id="${tweet.id}">
            <a class="tweet-fallback" href="${href}" target="_blank" rel="noopener">${SITE.escape(SITE.t("post.tweet.title"))} · @${SITE.escape(tweet.user)} ↗</a>
        </div>`;
    };

    const card = (post, { full = false } = {}) => {
        const el = document.createElement("article");
        el.className = "post" + (full ? " post-full" : "");
        const image = SITE.safeUrl(post.image_url);
        const link = `/post?id=${post.id}`;
        const meta = [`<a href="${link}" title="${SITE.escape(SITE.date(post.created_at))}">${SITE.escape(SITE.date(post.created_at))}</a>`];
        if (SITE.parseTweet(post.link_url)) meta.push(SITE.escape(SITE.t("post.tweet")));
        if (!post.published) meta.push(`<span class="badge">${SITE.escape(SITE.t("post.draft"))}</span>`);

        el.innerHTML = `
            <p class="post-meta">${meta.join("<span>·</span>")}</p>
            ${post.title ? `<h2 class="post-title">${full ? "" : `<a href="${link}">`}${SITE.escape(post.title)}${full ? "" : "</a>"}</h2>` : ""}
            ${post.body ? `<div class="post-body rich${full ? "" : " is-clamped"}">${SITE.richText(post.body)}</div>` : ""}
            ${image ? `<div class="post-image"><img src="${image}" alt="" loading="lazy" referrerpolicy="no-referrer"></div>` : ""}
            ${linkHtml(post.link_url)}
            <div class="post-foot">
                ${full ? "" : `<a href="${link}" class="link-btn post-more" hidden>${SITE.escape(SITE.t("post.more"))}</a>`}
                <button type="button" class="link-btn post-share">${SITE.escape(SITE.t("post.share"))}</button>
            </div>`;

        // "Read more" only when the clamped text actually overflows.
        const body = el.querySelector(".post-body.is-clamped");
        const more = el.querySelector(".post-more");
        if (body && more) requestAnimationFrame(() => { more.hidden = body.scrollHeight <= body.clientHeight + 2; });

        const share = el.querySelector(".post-share");
        share.addEventListener("click", async () => {
            const url = `${location.origin}${link}`;
            try { await navigator.clipboard.writeText(url); } catch (e) { window.prompt("", url); return; }
            share.textContent = SITE.t("post.copied");
            setTimeout(() => { share.textContent = SITE.t("post.share"); }, 2000);
        });

        // Embed after the card is in the page.
        requestAnimationFrame(() => embedTweets(el));
        return el;
    };

    // True when the posts table (or its link_url column) hasn't been created yet — supabase-posts.sql not run.
    const isMissingTable = (err) => Boolean(err && ["42P01", "42703", "PGRST205", "PGRST204", "PGRST200"].includes(err.code));

    SITE.posts = { list, get, card, title, isMissingTable };
})();
