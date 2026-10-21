// A single post (/post?id=…).
(() => {
    const SITE = window.SITE;
    const col = document.getElementById("postCol");
    const status = document.getElementById("postStatus");
    const id = Number(new URLSearchParams(location.search).get("id"));
    let post = null;
    let statusKey = "blog.loading";

    const render = () => {
        col.querySelectorAll(".post").forEach(el => el.remove());
        status.hidden = Boolean(post);
        status.textContent = SITE.t(statusKey);
        if (!post) return;
        const card = SITE.posts.card(post, { full: true });
        card.classList.add("post-full");
        col.append(card);
        document.title = `${post.title} · Swaxilep`;
    };

    (Number.isInteger(id) && id > 0 ? SITE.posts.get(id) : Promise.resolve(null))
        .then(p => { post = p; statusKey = "post.notfound"; })
        .catch(err => { console.error(err); statusKey = SITE.posts.isMissingTable(err) ? "post.notfound" : "blog.error"; })
        .finally(render);
    SITE.onLangChange(render);
})();
