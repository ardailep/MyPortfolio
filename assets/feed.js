// All posts (/posts).
(() => {
    const SITE = window.SITE;
    const feed = document.getElementById("feed");
    const status = document.getElementById("feedStatus");
    let posts = null;
    let statusKey = "posts.loading";

    const render = () => {
        status.hidden = Boolean(posts && posts.length);
        status.textContent = SITE.t(statusKey);
        if (posts) feed.replaceChildren(...posts.map(p => SITE.posts.card(p)));
    };

    SITE.posts.list()
        .then(list => { posts = list; statusKey = "activity.empty"; })
        .catch(err => { console.error(err); posts = []; statusKey = SITE.posts.isMissingTable(err) ? "activity.empty" : "posts.error"; })
        .finally(render);
    SITE.onLangChange(render);
})();
