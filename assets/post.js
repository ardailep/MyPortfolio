// A single post (/post?id=…).
(() => {
    const SITE = window.SITE;
    const col = document.getElementById("postCol");
    const status = document.getElementById("postStatus");
    const id = Number(new URLSearchParams(location.search).get("id"));
    let post = null;
    let statusKey = "posts.loading";

    const render = () => {
        status.hidden = Boolean(post);
        status.textContent = SITE.t(statusKey);
        if (!post) return;
        col.replaceChildren(SITE.posts.card(post, { full: true }));
        document.title = `${SITE.posts.title(post)} · Swaxilep`;
    };

    (Number.isInteger(id) && id > 0 ? SITE.posts.get(id) : Promise.resolve(null))
        .then(p => { post = p; statusKey = "post.notfound"; })
        .catch(err => { console.error(err); statusKey = SITE.posts.isMissingTable(err) ? "post.notfound" : "posts.error"; })
        .finally(render);
    SITE.onLangChange(render);
})();
