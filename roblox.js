// Roblox profile page (/roblox). Roblox itself is blocked in Turkey and doesn't allow browser requests from other
// sites, so the API calls go through RoProxy (a public mirror of the Roblox APIs that allows CORS).
// Avatar and game images load straight from Roblox's image CDN, which isn't blocked.
(() => {
    const USER_ID = 940248004;
    const API = (service, path) => `https://${service}.roproxy.com${path}`;
    const REFRESH_MS = 60 * 1000;   // live "playing" counts

    // ─────────────────────────────────────────
    // Language
    // ─────────────────────────────────────────
    const text = {
        en: {
            home: "← swaxilep.com", profileLabel: "Roblox profile", friends: "Friends", followers: "Followers",
            following: "Following", joined: "Joined", viewProfile: "View on Roblox", favorites: "Favorite games",
            created: "Games I made", loading: "Loading…", playing: "playing", visits: "visits", favs: "favorites",
            by: "by", unavailable: "This game isn't available right now.", noFavorites: "No favorite games yet.",
            error: "Couldn't reach Roblox right now. Try again in a bit.", updatedNow: "Live · updated just now",
            updatedAgo: "Live · updated {n} min ago", source: "Data comes live from Roblox via RoProxy. Not affiliated with Roblox.",
            title: "Swaxilep on Roblox",
        },
        tr: {
            home: "← swaxilep.com", profileLabel: "Roblox profili", friends: "Arkadaş", followers: "Takipçi",
            following: "Takip", joined: "Katılma", viewProfile: "Roblox'ta aç", favorites: "Favori oyunlar",
            created: "Yaptığım oyunlar", loading: "Yükleniyor…", playing: "oynuyor", visits: "ziyaret", favs: "favori",
            by: "yapan:", unavailable: "Bu oyun şu an erişilebilir değil.", noFavorites: "Henüz favori oyun yok.",
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
    const getJSON = async (url) => {
        const res = await fetch(url);
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

    const state = { user: null, counts: {}, avatar: null, favorites: [], created: [], stats: {}, icons: {}, updatedAt: null };

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

    async function loadGames() {
        const [favorites, created] = await Promise.all([
            getJSON(API("games", `/v2/users/${USER_ID}/favorite/games?limit=50&sortOrder=Desc`)),
            getJSON(API("games", `/v2/users/${USER_ID}/games?limit=50&sortOrder=Desc`)).catch(() => ({ data: [] })),
        ]);
        state.favorites = favorites.data || [];
        state.created = created.data || [];

        const ids = [...new Set([...state.favorites, ...state.created].map(g => g.id))];
        if (ids.length) {
            const icons = await thumbnails(API("thumbnails", `/v1/games/icons?universeIds=${ids.join(",")}&size=256x256&format=Png&isCircular=false`)).catch(() => []);
            icons.forEach(i => { if (i.state === "Completed") state.icons[i.targetId] = i.imageUrl; });
        }
        await refreshStats();
    }

    // visits / playing / favorites for every game (this is the part that refreshes every minute)
    async function refreshStats() {
        const ids = [...new Set([...state.favorites, ...state.created].map(g => g.id))];
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

    function renderProfile() {
        const { user, counts, avatar } = state;
        if (!user) return;
        $("displayName").textContent = user.displayName;
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

        // Available games first, unavailable ones at the end
        const ordered = [...state.favorites].sort((a, b) => {
            const ua = state.stats[a.id]?.isContentRestricted ? 1 : 0;
            const ub = state.stats[b.id]?.isContentRestricted ? 1 : 0;
            return ua - ub;
        });
        $("gameGrid").replaceChildren(...ordered.map(gameCard));

        $("createdSection").hidden = state.created.length === 0;
        $("createdGrid").replaceChildren(...state.created.map(gameCard));

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
