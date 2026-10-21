// Profile content (name, headline, about, experience, education, skills, contact links).
// Stored in Supabase as one JSON document (site_content, key "profile" — see supabase-profile.sql)
// and edited from the admin panel. DEFAULTS is used until something has been saved.
// Every text that can differ per language is { en, tr }; an empty one falls back to the other language.
(() => {
    const SITE = window.SITE;
    const KEY = "profile";
    const CACHE = "profile-cache";

    const DEFAULTS = {
        name: "Swaxilep",
        realName: "Teoman",
        photo: "shared/Profile.png",
        headline: { en: "3D Artist & Game Developer", tr: "3D Sanatçı ve Oyun Geliştirici" },
        sub: { en: "Sculpture student at Anadolu University", tr: "Anadolu Üniversitesi Heykel öğrencisi" },
        about: {
            en: "Hi! I'm Teoman. I'm 20, and I'm a designer and 3D modeler. I've been making 3D assets and environments for games and digital projects for several years now.\n\nI'm also studying Sculpture at Anadolu University, so I work on physical pieces as well as digital ones.\n\nI mostly go for a stylized, hand-painted look. I usually work in Blender and Roblox Studio, and I know enough Luau to script my own things in Roblox.",
            tr: "Selam! Ben Teoman. 20 yaşındayım; tasarımcı ve 3D modelciyim. Birkaç yıldır oyunlar ve dijital projeler için 3D modeller ve ortamlar yapıyorum.\n\nBir yandan da Anadolu Üniversitesi'nde Heykel okuyorum, yani hem elle hem de bilgisayarda üretiyorum.\n\nGenelde stilize, el boyaması tarzında çalışıyorum. En çok Blender ve Roblox Studio kullanıyorum; Roblox'ta kendi işlerimi kodlayacak kadar da Luau biliyorum.",
        },
        experience: [
            {
                title: { en: "3D Artist", tr: "3D Sanatçı" },
                sub: { en: "Games and digital projects · Blender", tr: "Oyunlar ve dijital projeler · Blender" },
                text: { en: "3D assets and environments, mostly in a stylized, hand-painted look.", tr: "Çoğunlukla stilize, el boyaması tarzında 3D modeller ve ortamlar." },
            },
            {
                title: { en: "Roblox Developer", tr: "Roblox Geliştirici" },
                sub: { en: "Roblox Studio · Luau", tr: "Roblox Studio · Luau" },
                text: { en: "I build games and environments in Roblox Studio and script my own systems in Luau.", tr: "Roblox Studio'da oyun ve ortam yapıyorum, kendi sistemlerimi Luau ile kodluyorum." },
            },
        ],
        education: [
            { title: { en: "Anadolu University", tr: "Anadolu Üniversitesi" }, sub: { en: "Sculpture", tr: "Heykel" } },
            { title: { en: "Mersin Nevit Kodallı Fine Arts High School", tr: "Mersin Nevit Kodallı Güzel Sanatlar Lisesi" }, sub: { en: "Fine Arts", tr: "Güzel Sanatlar" } },
        ],
        skills: [
            { en: "3D Modeling", tr: "3D Modelleme" },
            { en: "Environment Design", tr: "Ortam Tasarımı" },
            { en: "Hand-painted Textures", tr: "El Boyaması Doku" },
            { en: "Sculpture", tr: "Heykel" },
            { en: "Blender", tr: "Blender" },
            { en: "Roblox Studio", tr: "Roblox Studio" },
            { en: "Luau", tr: "Luau" },
        ],
        contacts: [
            { label: { en: "X (Twitter)", tr: "X (Twitter)" }, text: "@swaxilep", url: "https://x.com/swaxilep" },
            { label: { en: "Instagram", tr: "Instagram" }, text: "@swaxilep", url: "https://www.instagram.com/swaxilep/" },
            { label: { en: "Art gallery", tr: "Sanat galerisi" }, text: "@teoartgallery0", url: "https://www.instagram.com/teoartgallery0/" },
            { label: { en: "Portfolio", tr: "Portfolyo" }, text: "ArtStation", url: "https://www.artstation.com/swaxilep" },
            { label: { en: "Discord", tr: "Discord" }, text: "swaxilep", url: "https://discord.com/users/454979640306696192" },
            { label: { en: "Roblox", tr: "Roblox" }, text: "Swaxilep", url: "https://www.roblox.com/users/940248004/profile" },
            { label: { en: "Notes", tr: "Notlar" }, text: { en: "Leave a note on the site", tr: "Siteye not bırak" }, url: "/notes" },
        ],
    };

    const clone = (v) => JSON.parse(JSON.stringify(v));

    // Saved values replace the defaults key by key, so new fields added later still get a default.
    const merge = (saved) => {
        const out = clone(DEFAULTS);
        if (saved && typeof saved === "object") {
            Object.keys(DEFAULTS).forEach(k => { if (saved[k] !== undefined && saved[k] !== null) out[k] = saved[k]; });
        }
        return out;
    };

    // Text in the current language, falling back to the other one.
    const pick = (value) => {
        if (value == null) return "";
        if (typeof value === "string") return value;
        const other = SITE.lang === "tr" ? "en" : "tr";
        return String(value[SITE.lang] || value[other] || "");
    };

    // Allowed link targets: http(s), mailto:, or a page on this site. A bare email becomes mailto:.
    const href = (url) => {
        const u = String(url || "").trim();
        if (/^[^\s@/:]+@[^\s@/]+\.[^\s@/]+$/.test(u)) return `mailto:${u}`;
        if (/^(https?:\/\/|mailto:)[^\s"'<>]+$/i.test(u)) return u;
        if (/^\/[^\s"'<>]*$/.test(u) && !u.startsWith("//")) return u;
        return "";
    };

    const cached = () => {
        try { const raw = localStorage.getItem(CACHE); return raw ? merge(JSON.parse(raw)) : null; } catch (e) { return null; }
    };

    // Resolves to { profile, saved } — saved is false when nothing is stored yet (defaults in use).
    const load = async () => {
        if (!SITE.db) return { profile: clone(DEFAULTS), saved: false };
        const { data, error } = await SITE.db.from("site_content").select("data").eq("key", KEY).maybeSingle();
        if (error) throw error;
        try { localStorage.setItem(CACHE, JSON.stringify(data ? data.data : null)); } catch (e) { /* storage unavailable */ }
        return { profile: merge(data && data.data), saved: Boolean(data) };
    };

    const save = async (profile) => {
        const { data, error } = await SITE.db.from("site_content")
            .upsert({ key: KEY, data: profile, updated_at: new Date().toISOString() })
            .select("key");
        if (error) throw error;
        if (!data || !data.length) throw new Error("not saved (are you still an admin?)");
        try { localStorage.setItem(CACHE, JSON.stringify(profile)); } catch (e) { /* storage unavailable */ }
    };

    SITE.profile = { DEFAULTS, clone, merge, pick, href, cached, load, save };
})();
