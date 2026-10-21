// All posts (/posts), as a list or a grid. The chosen view is remembered in this browser.
(() => {
    const SITE = window.SITE;
    const feed = document.getElementById("feed");
    const status = document.getElementById("feedStatus");
    const viewButtons = document.querySelectorAll(".view-switch [data-view]");
    let posts = null;
    let statusKey = "posts.loading";

    let view = "list";
    try { if (localStorage.getItem("posts-view") === "grid") view = "grid"; } catch (e) { /* storage unavailable */ }

    const render = () => {
        status.hidden = Boolean(posts && posts.length);
        status.textContent = SITE.t(statusKey);
        feed.className = view === "grid" ? "grid" : "feed";
        viewButtons.forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.view === view)));
        if (posts) feed.replaceChildren(...posts.map(p => (view === "grid" ? SITE.posts.tile(p) : SITE.posts.card(p))));
    };

    viewButtons.forEach(btn => btn.addEventListener("click", () => {
        if (btn.dataset.view === view) return;
        view = btn.dataset.view;
        try { localStorage.setItem("posts-view", view); } catch (e) { /* storage unavailable */ }
        render();
    }));

    SITE.posts.list()
        .then(list => { posts = list; statusKey = "activity.empty"; })
        .catch(err => { console.error(err); posts = []; statusKey = SITE.posts.isMissingTable(err) ? "activity.empty" : "posts.error"; })
        .finally(render);
    SITE.onLangChange(render);
})();
