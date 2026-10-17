// Roblox profile page (/roblox). Roblox itself is blocked in Turkey and doesn't allow browser requests from other
// sites, so the API calls go through RoProxy (a public mirror of the Roblox APIs that allows CORS).
// Avatar and game images load straight from Roblox's image CDN, which isn't blocked.
(() => {
    const USER_ID = 940248004;
    const API = (service, path) => `https://${service}.roproxy.com${path}`;
    const REFRESH_MS = 60 * 1000;   // live "playing" counts
    // Roblox only reveals Premium status to the account itself, so it's set here by hand.
    // Change to false if the Premium subscription ends.
    const HAS_PREMIUM = true;

    // ─────────────────────────────────────────
    // Language
    // ─────────────────────────────────────────
    const text = {
        en: {
            home: "← swaxilep.com", profileLabel: "Roblox profile", friends: "Friends", followers: "Followers",
            following: "Following", joined: "Joined", viewProfile: "View on Roblox", favorites: "Games I’ve developed",
            loading: "Loading…", playing: "playing", visits: "visits", favs: "favorites",
            by: "by", unavailable: "This game isn't available right now.", noFavorites: "No games yet.",
            error: "Couldn't reach Roblox right now. Try again in a bit.", updatedNow: "Live · updated just now",
            updatedAgo: "Live · updated {n} min ago", source: "Data comes live from Roblox via RoProxy. Not affiliated with Roblox.",
            title: "Swaxilep on Roblox",
        },
        tr: {
            home: "← swaxilep.com", profileLabel: "Roblox profili", friends: "Arkadaş", followers: "Takipçi",
            following: "Takip", joined: "Katılma", viewProfile: "Roblox'ta aç", favorites: "Geliştirdiğim Oyunlar",
            loading: "Yükleniyor…", playing: "oynuyor", visits: "ziyaret", favs: "favori",
            by: "yapan:", unavailable: "Bu oyun şu an erişilebilir değil.", noFavorites: "Henüz oyun yok.",
            error: "Şu an Roblox'a ulaşılamıyor. Biraz sonra tekrar dene.", updatedNow: "Canlı · az önce güncellendi",
            updatedAgo: "Canlı · {n} dk önce güncellendi", source: "Veriler Roblox'tan RoProxy üzerinden canlı geliyor. Roblox ile bağlantılı değildir.",
            title: "Swaxilep · Roblox",
        },
    };

    let lang = "en";
    try { lang = localStorage.getItem("lang") || ((navigator.language || "").startsWith("tr") ? "tr" : "en"); } catch (e) { /* storage unavailable */ }
    if (!text[lang]) lang = "en";
    const t = (key) => text[lang][key] ?? text.en[key] ?? key;

    const $ = (id) => document.getElementById(id);
    const locale = () => (lang === "tr" ? "tr-TR" : "en-US");
    const compact = (n) => new Intl.NumberFormat(locale(), { notation: "compact", maximumFractionDigits: 1 }).format(n);
    const full = (n) => new Intl.NumberFormat(locale()).format(n);

    // ─────────────────────────────────────────
    // Data
    // ─────────────────────────────────────────
    // 10 s limit so a stuck request can't leave the page on "Loading…" forever
    const getJSON = async (url) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(`${res.status} ${url}`);
        return res.json();
    };

    // Thumbnails can come back "Pending" while Roblox renders them — retry a few times.
    const thumbnails = async (url, tries = 4) => {
        for (let i = 0; i < tries; i++) {
            const { data } = await getJSON(url);
            if (data.every(d => d.state !== "Pending")) return data;
            await new Promise(r => setTimeout(r, 1500));
        }
        return (await getJSON(url)).data;
    };

    const state = { user: null, counts: {}, avatar: null, favorites: [], stats: {}, icons: {}, updatedAt: null };

    async function loadProfile() {
        const [user, friends, followers, following, avatar] = await Promise.all([
            getJSON(API("users", `/v1/users/${USER_ID}`)),
            getJSON(API("friends", `/v1/users/${USER_ID}/friends/count`)).catch(() => null),
            getJSON(API("friends", `/v1/users/${USER_ID}/followers/count`)).catch(() => null),
            getJSON(API("friends", `/v1/users/${USER_ID}/followings/count`)).catch(() => null),
            thumbnails(API("thumbnails", `/v1/users/avatar?userIds=${USER_ID}&size=720x720&format=Png&isCircular=false`)).catch(() => []),
        ]);
        state.user = user;
        state.counts = { friends: friends?.count, followers: followers?.count, following: following?.count };
        state.avatar = avatar[0]?.imageUrl || null;
        renderProfile();
    }

    // The games I've developed are the ones I keep in my Roblox favorites
    async function loadGames() {
        const favorites = await getJSON(API("games", `/v2/users/${USER_ID}/favorite/games?limit=50&sortOrder=Desc`));
        state.favorites = favorites.data || [];

        const ids = state.favorites.map(g => g.id);
        if (ids.length) {
            const icons = await thumbnails(API("thumbnails", `/v1/games/icons?universeIds=${ids.join(",")}&size=256x256&format=Png&isCircular=false`)).catch(() => []);
            icons.forEach(i => { if (i.state === "Completed") state.icons[i.targetId] = i.imageUrl; });
        }
        await refreshStats();
    }

    // visits / playing / favorites for every game (this is the part that refreshes every minute)
    async function refreshStats() {
        const ids = state.favorites.map(g => g.id);
        if (ids.length) {
            const { data } = await getJSON(API("games", `/v1/games?universeIds=${ids.join(",")}`));
            // Restricted/private games come back with id 0 — match by position as a fallback
            data.forEach((g, i) => { state.stats[g.id || ids[i]] = g; });
        }
        state.updatedAt = Date.now();
        renderGames();
    }

    // ─────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────
    let statusKey = "loading";

    function renderStatic() {
        document.documentElement.lang = lang;
        document.title = t("title");
        document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
        document.querySelectorAll(".top-lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
        $("gamesStatus").textContent = t(statusKey);
    }

    // Small icon next to the display name (Premium / verified)
    function badge(kind, label, svgPaths) {
        const span = document.createElement("span");
        span.className = `name-badge name-badge--${kind}`;
        span.title = label;
        span.setAttribute("role", "img");
        span.setAttribute("aria-label", label);
        span.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${svgPaths}</svg>`;
        return span;
    }

    function renderProfile() {
        const { user, counts, avatar } = state;
        if (!user) return;
        $("displayName").textContent = user.displayName;
        if (HAS_PREMIUM) $("displayName").appendChild(badge("premium", "Roblox Premium",
            '<path fill-rule="evenodd" d="M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Zm0 4v12h8v-4h4V6H6Zm4 4h4v4h-4v-4Z"/>'));
        if (user.hasVerifiedBadge) $("displayName").appendChild(badge("verified", "Verified",
            '<path d="M12 1.5 14.7 3.6l3.4-.2.9 3.3 2.9 1.8-1.2 3.2 1.2 3.2-2.9 1.8-.9 3.3-3.4-.2L12 22.5l-2.7-2.1-3.4.2-.9-3.3L2.1 15.5 3.3 12.3 2.1 9.1 5 7.3l.9-3.3 3.4.2L12 1.5Zm-1.2 13.9 5.6-5.6-1.4-1.4-4.2 4.2-2-2-1.4 1.4 3.4 3.4Z"/>'));
        $("username").textContent = `@${user.name}`;
        $("bio").textContent = user.description || "";
        $("bio").hidden = !user.description;

        $("statFriends").textContent = counts.friends != null ? full(counts.friends) : "–";
        $("statFollowers").textContent = counts.followers != null ? full(counts.followers) : "–";
        $("statFollowing").textContent = counts.following != null ? full(counts.following) : "–";
        $("statJoined").textContent = new Intl.DateTimeFormat(locale(), { month: "short", year: "numeric" }).format(new Date(user.created));

        if (avatar && $("avatarImg").src !== avatar) {
            $("avatarImg").onload = () => { $("avatarImg").hidden = false; $("avatarPlaceholder").hidden = true; };
            $("avatarImg").src = avatar;
            $("avatarImg").alt = `${user.displayName}'s Roblox avatar`;
        }
        $("profile").setAttribute("aria-busy", "false");
    }

    function gameCard(game) {
        const stats = state.stats[game.id];
        const unavailable = !stats || stats.isContentRestricted || !stats.rootPlaceId;
        const placeId = stats?.rootPlaceId || game.rootPlace?.id;

        const li = document.createElement("li");
        li.className = "game" + (unavailable ? " is-unavailable" : "");

        const link = document.createElement(placeId && !unavailable ? "a" : "div");
        link.className = "game-link";
        if (link.tagName === "A") {
            link.href = `https://www.roblox.com/games/${placeId}`;
            link.target = "_blank";
            link.rel = "noopener";
        }

        const thumb = document.createElement("div");
        thumb.className = "game-thumb";
        if (state.icons[game.id]) {
            const img = document.createElement("img");
            img.src = state.icons[game.id];
            img.alt = "";
            img.loading = "lazy";
            thumb.appendChild(img);
        }
        if (!unavailable && stats.playing > 0) {
            const live = document.createElement("span");
            live.className = "game-live";
            live.textContent = `${full(stats.playing)} ${t("playing")}`;
            thumb.appendChild(live);
        }

        const body = document.createElement("div");
        body.className = "game-body";

        const name = document.createElement("h3");
        name.className = "game-name";
        name.textContent = game.name;
        body.appendChild(name);

        const creator = document.createElement("p");
        creator.className = "game-creator";
        creator.textContent = unavailable ? t("unavailable") : `${t("by")} ${stats.creator?.name || game.creator?.name || "?"}`;
        body.appendChild(creator);

        const description = (stats?.description || game.description || "").trim();
        if (!unavailable && description) {
            const desc = document.createElement("p");
            desc.className = "game-desc";
            desc.textContent = description;
            body.appendChild(desc);
        }

        if (!unavailable) {
            const dl = document.createElement("dl");
            dl.className = "game-stats";
            [["playing", stats.playing], ["visits", stats.visits], ["favs", stats.favoritedCount]].forEach(([key, value]) => {
                const row = document.createElement("div");
                const dt = document.createElement("dt");
                const dd = document.createElement("dd");
                dt.textContent = t(key);
                dd.textContent = compact(value || 0);
                dd.title = full(value || 0);
                row.append(dd, dt);
                dl.appendChild(row);
            });
            body.appendChild(dl);
        }

        link.append(thumb, body);
        li.appendChild(link);
        return li;
    }

    function renderGames() {
        statusKey = "noFavorites";
        $("gamesStatus").textContent = t(statusKey);
        $("gamesStatus").hidden = state.favorites.length > 0;

        // Most visited first; unavailable games at the end
        const visits = (g) => {
            const s = state.stats[g.id];
            return s && !s.isContentRestricted && s.rootPlaceId ? s.visits || 0 : -1;
        };
        const ordered = [...state.favorites].sort((a, b) => visits(b) - visits(a));
        $("gameGrid").replaceChildren(...ordered.map(gameCard));


        renderUpdated();
    }

    function renderUpdated() {
        if (!state.updatedAt) return;
        const mins = Math.floor((Date.now() - state.updatedAt) / 60000);
        $("updated").textContent = mins < 1 ? t("updatedNow") : t("updatedAgo").replace("{n}", mins);
    }

    function renderAll() {
        renderStatic();
        renderProfile();
        if (state.updatedAt) renderGames();
    }

    // ─────────────────────────────────────────
    // Start
    // ─────────────────────────────────────────
    document.querySelectorAll(".top-lang button").forEach(btn => btn.addEventListener("click", () => {
        lang = btn.dataset.lang;
        try { localStorage.setItem("lang", lang); } catch (e) { /* storage unavailable */ }
        renderAll();
    }));

    renderStatic();

    loadProfile().catch(err => { console.error(err); $("displayName").textContent = "Swaxilep"; });
    loadGames()
        .then(() => {
            setInterval(() => { if (!document.hidden) refreshStats().catch(console.error); }, REFRESH_MS);
            setInterval(renderUpdated, 15 * 1000);
        })
        .catch(err => {
            console.error(err);
            statusKey = "error";
            $("gamesStatus").textContent = t(statusKey);
            $("gamesStatus").hidden = false;
        });

    // Same protection as the main site
    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("dragstart", (e) => { if (e.target.tagName === "IMG") e.preventDefault(); });
    document.addEventListener("keydown", (e) => {
        const key = (e.key || "").toUpperCase();
        const ctrl = e.ctrlKey || e.metaKey;
        if (key === "F12" || (ctrl && (e.shiftKey || e.altKey) && ["I", "J", "C"].includes(key)) || (ctrl && key === "U")) e.preventDefault();
    });
})();
