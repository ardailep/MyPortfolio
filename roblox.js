// Roblox profile page (/roblox). Roblox itself is blocked in Turkey and doesn't allow browser requests from other
// sites, so the API calls go through RoProxy (a public mirror of the Roblox APIs that allows CORS).
// Avatar, game and group images load straight from Roblox's image CDN, which isn't blocked.
// Language switch, background video and page protection come from common.js (loaded first).
(() => {
    const SITE = window.SITE;
    const USER_ID = 940248004;
    const API = (service, path) => `https://${service}.roproxy.com${path}`;
    const REFRESH_MS = 60 * 1000;   // live "playing" counts
    // Roblox only reveals Premium status to the account itself, so it's set here by hand.
    // Change to false if the Premium subscription ends.
    const HAS_PREMIUM = true;
    // Groups shown: my role is at least this rank (members are rank 1, owners 255) and the group is big enough
    const MANAGER_RANK = 100;
    const MIN_MEMBERS = 500;

    // ─────────────────────────────────────────
    // Language
    // ─────────────────────────────────────────
    const text = {
        en: {
            home: "← swaxilep.com", profileLabel: "Roblox profile", friends: "Friends", followers: "Followers",
            following: "Following", joined: "Joined", viewProfile: "View on Roblox", favorites: "Games I’ve developed",
            groups: "Groups I develop games for", members: "members", loading: "Loading…", playing: "playing", visits: "visits",
            favs: "favorites", by: "by", noFavorites: "No games yet.", noGroups: "No groups yet.",
            error: "Couldn't reach Roblox right now. Try again in a bit.", updatedNow: "Live · updated just now",
            updatedAgo: "Live · updated {n} min ago", source: "Data comes live from Roblox via RoProxy. Not affiliated with Roblox.",
            title: "Swaxilep · Roblox",
        },
        tr: {
            home: "← swaxilep.com", profileLabel: "Roblox profili", friends: "Arkadaş", followers: "Takipçi",
            following: "Takip", joined: "Katılma", viewProfile: "Roblox'ta aç", favorites: "Geliştirdiğim Oyunlar",
            groups: "Oyun Geliştirdiğim Gruplar", members: "üye", loading: "Yükleniyor…", playing: "oynuyor", visits: "ziyaret",
            favs: "favori", by: "yapan:", noFavorites: "Henüz oyun yok.", noGroups: "Henüz grup yok.",
            error: "Şu an Roblox'a ulaşılamıyor. Biraz sonra tekrar dene.", updatedNow: "Canlı · az önce güncellendi",
            updatedAgo: "Canlı · {n} dk önce güncellendi", source: "Veriler Roblox'tan RoProxy üzerinden canlı geliyor. Roblox ile bağlantılı değildir.",
            title: "Swaxilep · Roblox",
        },
    };

    let lang = text[SITE.lang] ? SITE.lang : "en";
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

    const state = {
        user: null, counts: {}, avatar: null,
        favorites: [], lastGood: {}, favCounts: {}, icons: {}, updatedAt: null,
        groups: null, groupIcons: {},
    };

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

        // Show the games right away; icons fill in when they're ready (they can be slow)
        await refreshStats();

        const ids = state.favorites.map(g => g.id);
        if (ids.length) {
            thumbnails(API("thumbnails", `/v1/games/icons?universeIds=${ids.join(",")}&size=256x256&format=Png&isCircular=false`))
                .then(icons => {
                    icons.forEach(i => { if (i.state === "Completed") state.icons[i.targetId] = i.imageUrl; });
                    renderGames();
                })
                .catch(() => { });
        }
    }

    // visits / playing / favorites for every game (this is the part that refreshes every minute)
    async function refreshStats() {
        const ids = state.favorites.map(g => g.id);
        if (ids.length) {
            const { data } = await getJSON(API("games", `/v1/games?universeIds=${ids.join(",")}`));
            // Roblox sometimes returns a game as "restricted" (id 0, all zeros) — match by position,
            // and keep the last good numbers so the card never goes blank.
            data.forEach((g, i) => {
                const id = g.id || ids[i];
                if (!g.isContentRestricted && g.rootPlaceId) state.lastGood[id] = g;
            });

            // No good numbers yet for a restricted game: fetch its favorites count separately
            // (visits come from the favorites list itself)
            const missing = ids.filter(id => !state.lastGood[id] && state.favCounts[id] == null);
            await Promise.all(missing.map(id =>
                getJSON(API("games", `/v1/games/${id}/favorites/count`))
                    .then(r => { state.favCounts[id] = r.favoritesCount; })
                    .catch(() => { })));
        }
        state.updatedAt = Date.now();
        renderGames();
    }

    // Groups I develop games for: staff role (rank >= MANAGER_RANK) and at least MIN_MEMBERS members, biggest first
    async function loadGroups() {
        const { data } = await getJSON(API("groups", `/v1/users/${USER_ID}/groups/roles?includeLocked=false`));
        state.groups = (data || [])
            .filter(g => g.role && g.role.rank >= MANAGER_RANK && (g.group.memberCount || 0) >= MIN_MEMBERS)
            .sort((a, b) => (b.group.memberCount || 0) - (a.group.memberCount || 0));

        renderGroups();   // names and member counts first, icons when ready

        const ids = state.groups.map(g => g.group.id);
        if (ids.length) {
            thumbnails(API("thumbnails", `/v1/groups/icons?groupIds=${ids.join(",")}&size=150x150&format=Png&isCircular=false`))
                .then(icons => {
                    icons.forEach(i => { if (i.state === "Completed") state.groupIcons[i.targetId] = i.imageUrl; });
                    renderGroups();
                })
                .catch(() => { });
        }
    }

    // Everything a game card shows, from the live stats or the fallbacks above
    function gameInfo(game) {
        const s = state.lastGood[game.id];
        return {
            placeId: s?.rootPlaceId || game.rootPlace?.id,
            creator: s?.creator?.name || game.creator?.name || "?",
            description: (s?.description || game.description || "").trim(),
            playing: s ? s.playing : null,
            visits: s ? s.visits : game.placeVisits,
            favorites: s ? s.favoritedCount : state.favCounts[game.id],
        };
    }

    // ─────────────────────────────────────────
    // Rendering
    // ─────────────────────────────────────────
    let statusKey = "loading";
    let groupsStatusKey = "loading";

    function renderStatic() {
        document.documentElement.lang = lang;
        document.title = t("title");
        document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
        $("gamesStatus").textContent = t(statusKey);
        $("groupsStatus").textContent = t(groupsStatusKey);
    }

    function renderProfile() {
        const { user, counts, avatar } = state;
        if (!user) return;
        $("displayName").textContent = user.displayName;
        if (HAS_PREMIUM) {
            // Roblox's own Premium icon (from the Roblox client's PlayerList textures)
            const icon = document.createElement("img");
            icon.className = "name-badge";
            icon.src = "shared/premium.png";
            icon.alt = "Roblox Premium";
            icon.title = "Roblox Premium";
            $("displayName").appendChild(icon);
        }
        if (user.hasVerifiedBadge) {
            const check = document.createElement("span");
            check.className = "name-badge name-badge--verified";
            check.title = "Verified";
            check.setAttribute("role", "img");
            check.setAttribute("aria-label", "Verified");
            check.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 14.7 3.6l3.4-.2.9 3.3 2.9 1.8-1.2 3.2 1.2 3.2-2.9 1.8-.9 3.3-3.4-.2L12 22.5l-2.7-2.1-3.4.2-.9-3.3L2.1 15.5 3.3 12.3 2.1 9.1 5 7.3l.9-3.3 3.4.2L12 1.5Zm-1.2 13.9 5.6-5.6-1.4-1.4-4.2 4.2-2-2-1.4 1.4 3.4 3.4Z"/></svg>';
            $("displayName").appendChild(check);
        }
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

    // One row: picture on the left, title / subtitle / text / stats on the right
    function row({ href, image, live, title, subtitle, description, stats }) {
        const li = document.createElement("li");
        li.className = "row";

        const link = document.createElement(href ? "a" : "div");
        link.className = "row-link";
        if (href) {
            link.href = href;
            link.target = "_blank";
            link.rel = "noopener";
        }

        const thumb = document.createElement("div");
        thumb.className = "row-thumb";
        if (image) {
            const img = document.createElement("img");
            img.src = image;
            img.alt = "";
            img.loading = "lazy";
            thumb.appendChild(img);
        }
        if (live) {
            const tag = document.createElement("span");
            tag.className = "row-live";
            tag.textContent = live;
            thumb.appendChild(tag);
        }

        const body = document.createElement("div");
        body.className = "row-body";

        const h3 = document.createElement("h3");
        h3.className = "row-title";
        h3.textContent = title;
        body.appendChild(h3);

        if (subtitle) {
            const sub = document.createElement("p");
            sub.className = "row-sub";
            sub.textContent = subtitle;
            body.appendChild(sub);
        }

        if (description) {
            const desc = document.createElement("p");
            desc.className = "row-desc";
            desc.textContent = description;
            body.appendChild(desc);
        }

        if (stats && stats.length) {
            const dl = document.createElement("dl");
            dl.className = "row-stats";
            stats.forEach(([key, value]) => {
                const item = document.createElement("div");
                const dt = document.createElement("dt");
                const dd = document.createElement("dd");
                dt.textContent = t(key);
                dd.textContent = value == null ? "–" : compact(value);   // "–" only if Roblox gave us nothing at all
                if (value != null) dd.title = full(value);
                item.append(dd, dt);
                dl.appendChild(item);
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

        // Most visited first
        const visits = (g) => gameInfo(g).visits || 0;
        const ordered = [...state.favorites].sort((a, b) => visits(b) - visits(a));
        $("gameGrid").replaceChildren(...ordered.map(game => {
            const info = gameInfo(game);
            return row({
                href: info.placeId ? `https://www.roblox.com/games/${info.placeId}` : null,
                image: state.icons[game.id],
                live: info.playing > 0 ? `${full(info.playing)} ${t("playing")}` : null,
                title: game.name,
                subtitle: `${t("by")} ${info.creator}`,
                description: info.description,
                stats: [["playing", info.playing], ["visits", info.visits], ["favs", info.favorites]],
            });
        }));

        renderUpdated();
    }

    function renderGroups() {
        if (!state.groups) return;
        groupsStatusKey = "noGroups";
        $("groupsStatus").textContent = t(groupsStatusKey);
        $("groupsStatus").hidden = state.groups.length > 0;

        $("groupGrid").replaceChildren(...state.groups.map(({ group, role }) => row({
            href: `https://www.roblox.com/communities/${group.id}`,
            image: state.groupIcons[group.id],
            title: group.name,
            subtitle: role.name,
            stats: [["members", group.memberCount]],
        })));
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
        renderGroups();
    }

    // ─────────────────────────────────────────
    // Start
    // ─────────────────────────────────────────
    SITE.onLangChange((next) => { lang = text[next] ? next : "en"; renderAll(); });
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
    loadGroups().catch(err => {
        console.error(err);
        groupsStatusKey = "error";
        $("groupsStatus").textContent = t(groupsStatusKey);
        $("groupsStatus").hidden = false;
    });
})();
