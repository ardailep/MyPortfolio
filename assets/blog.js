// All posts (/blog).
(() => {
    const SITE = window.SITE;
    const feed = document.getElementById("feed");
    const status = document.getElementById("feedStatus");
    let posts = null;
    let statusKey = "blog.loading";

    const render = () => {
        feed.querySelectorAll(".post").forEach(el => el.remove());
        status.hidden = Boolean(posts && posts.length);
        status.textContent = SITE.t(statusKey);
        if (posts) feed.append(...posts.map(p => SITE.posts.card(p)));
    };

    SITE.posts.list()
        .then(list => { posts = list; statusKey = "activity.empty"; })
        .catch(err => { console.error(err); posts = []; statusKey = SITE.posts.isMissingTable(err) ? "activity.empty" : "blog.error"; })
        .finally(render);
    SITE.onLangChange(() => { if (posts) render(); else status.textContent = SITE.t(statusKey); });
})();
