// Shared by every page: translations, header/footer, Supabase client, formatting helpers, visitor counter.
// Load after config.js (and supabase-js) and before the page's own script — it exposes window.SITE.
(() => {
    // Clean URLs: show /notes instead of /notes.html and / instead of /index.html
    if (location.protocol.startsWith("http")) {
        const clean = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
        if (clean !== location.pathname) history.replaceState(null, "", clean + location.search + location.hash);
    }

    // ─────────────────────────────────────────
    // 1. TRANSLATIONS
    // ─────────────────────────────────────────
    const i18n = {
        en: {
            "meta.home": "Swaxilep (Teoman) · 3D Artist & Game Developer",
            "meta.posts": "Posts · Swaxilep",
            "meta.post": "Post · Swaxilep",
            "meta.notes": "Notes · Swaxilep",
            "meta.admin": "Admin · Swaxilep",
            "meta.description": "Swaxilep (Teoman) — 3D artist and game developer, sculpture student at Anadolu University. Posts, notes and contact.",

            "nav.profile": "Profile",
            "nav.posts": "Posts",
            "nav.notes": "Notes",
            "nav.admin": "Admin",
            "footer.copy": "© 2026 Swaxilep",
            "footer.visitors.one": "1 visitor",
            "footer.visitors": "{n} visitors",

            "profile.headline": "3D Artist & Game Developer",
            "profile.sub": "Sculpture student at Anadolu University",
            "profile.contact": "Get in touch",
            "profile.note": "Leave a note",

            "about.title": "About",
            "about.p1": "Hi! I'm Teoman. I'm 20, and I'm a designer and 3D modeler. I've been making 3D assets and environments for games and digital projects for several years now.",
            "about.p2": "I'm also studying Sculpture at Anadolu University, so I work on physical pieces as well as digital ones.",
            "about.p3": "I mostly go for a stylized, hand-painted look. I usually work in Blender and Roblox Studio, and I know enough Luau to script my own things in Roblox.",

            "activity.title": "Latest posts",
            "activity.all": "All posts →",
            "activity.empty": "No posts yet.",

            "exp.title": "Experience",
            "exp.1.title": "3D Artist",
            "exp.1.sub": "Games and digital projects · Blender",
            "exp.1.text": "3D assets and environments, mostly in a stylized, hand-painted look.",
            "exp.2.title": "Roblox Developer",
            "exp.2.sub": "Roblox Studio · Luau",
            "exp.2.text": "I build games and environments in Roblox Studio and script my own systems in Luau.",

            "edu.title": "Education",
            "edu.1.title": "Anadolu University",
            "edu.1.sub": "Sculpture",
            "edu.2.title": "Mersin Nevit Kodallı Fine Arts High School",
            "edu.2.sub": "Fine Arts",

            "skills.title": "Skills",
            "skill.modeling": "3D Modeling",
            "skill.environment": "Environment Design",
            "skill.handpainted": "Hand-painted Textures",
            "skill.sculpture": "Sculpture",

            "contact.title": "Contact",
            "contact.email": "Email",
            "contact.note": "Notes",
            "contact.note.text": "Leave a note on the site",
            "contact.portfolio": "Portfolio",
            "contact.gallery": "Art gallery",

            "post.more": "Read more →",
            "post.share": "Copy link",
            "post.copied": "Link copied",
            "post.edited": "edited",
            "post.draft": "Draft",
            "post.tweet": "on X",
            "post.tweet.title": "Post on X",
            "post.notfound": "This post doesn't exist or was removed.",
            "post.back": "← All posts",
            "posts.title": "Posts",
            "posts.lede": "Updates, work in progress and things I've shared.",
            "posts.loading": "Loading posts…",
            "posts.error": "Couldn't load the posts. Please try again later.",

            "notes.title": "Notes",
            "notes.lede": "Leave me a note — it shows up below for everyone. One note per person.",
            "notes.name": "Your name",
            "notes.name.ph": "e.g. Alex",
            "notes.message": "Your note",
            "notes.message.ph": "Write something…",
            "notes.send": "Post note",
            "notes.sending": "Posting…",
            "notes.once": "You can only post one note.",
            "notes.sent.title": "Your note is up!",
            "notes.sent.text": "Thanks for writing. You can see it below.",
            "notes.loading": "Loading notes…",
            "notes.empty": "No notes yet. Be the first!",
            "notes.error": "Couldn't load the notes. Please try again later.",
            "notes.error.generic": "Something went wrong. Please try again.",
            "notes.you": "You",
            "notes.reply": "Swaxilep replied",
            "notes.count.one": "1 note",
            "notes.count": "{n} notes",
            "notes.offline": "The database isn't connected, so notes can't be posted right now.",

            "admin.title": "Admin panel",
            "admin.login.title": "Log in",
            "admin.email": "Email",
            "admin.password": "Password",
            "admin.login": "Log in",
            "admin.logout": "Log out",
            "admin.login.error": "Wrong email or password, or this account isn't an admin.",
            "admin.noconfig": "Supabase isn't set up in config.js, so the admin panel can't work.",
            "admin.tab.posts": "Posts",
            "admin.tab.notes": "Notes",
            "admin.new": "New post",
            "admin.editing": "Edit post",
            "admin.f.title": "Title (optional)",
            "admin.f.body": "Text",
            "admin.f.body.hint": "**bold**, *italic*, [link](https://…), “- ” for a list, “# ” for a heading. An empty line starts a new paragraph.",
            "admin.f.tweet": "Link (optional)",
            "admin.f.tweet.ph": "https://…",
            "admin.f.tweet.hint": "Any link works. X (Twitter) post links are embedded with their images; other links show as a link card.",
            "admin.f.date": "Share date",
            "admin.f.image": "Image (optional)",
            "admin.f.upload": "Upload image",
            "admin.f.image.ph": "…or paste an image URL (https://)",
            "admin.f.remove": "Remove image",
            "admin.f.published": "Published (untick to keep it as a draft)",
            "admin.save": "Save",
            "admin.cancel": "Cancel",
            "admin.saving": "Saving…",
            "admin.saved": "Saved!",
            "admin.uploading": "Uploading…",
            "admin.upload.error": "Upload failed. Did you run supabase-posts.sql? You can also paste an image URL.",
            "admin.upload.big": "That image is over 5 MB.",
            "admin.required": "Fill in at least a title, some text or a link.",
            "admin.tweet.bad": "The link has to start with http:// or https://",
            "admin.image.bad": "The image URL has to start with https://",
            "admin.error": "Something went wrong: {msg}",
            "admin.posts.list": "Your posts",
            "admin.posts.empty": "No posts yet. Write your first one above.",
            "admin.posts.missing": "The posts table is missing or out of date — run supabase-posts.sql in Supabase → SQL Editor.",
            "admin.edit": "Edit",
            "admin.view": "View",
            "admin.delete": "Delete",
            "admin.delete.post": "Delete this post? This can't be undone.",
            "admin.delete.note": "Delete this note? This can't be undone.",
            "admin.notes.empty": "No notes yet.",
            "admin.reply.ph": "Write a reply…",
            "admin.gif.ph": "GIF link (optional, https://)",
            "admin.reply.save": "Save reply",
        },
        tr: {
            "meta.home": "Swaxilep (Teoman) · 3D Sanatçı ve Oyun Geliştirici",
            "meta.posts": "Gönderiler · Swaxilep",
            "meta.post": "Gönderi · Swaxilep",
            "meta.notes": "Notlar · Swaxilep",
            "meta.admin": "Yönetim · Swaxilep",
            "meta.description": "Swaxilep (Teoman) — 3D sanatçı ve oyun geliştirici, Anadolu Üniversitesi Heykel öğrencisi. Gönderiler, notlar ve iletişim.",

            "nav.profile": "Profil",
            "nav.posts": "Gönderiler",
            "nav.notes": "Notlar",
            "nav.admin": "Yönetim",
            "footer.copy": "© 2026 Swaxilep",
            "footer.visitors.one": "1 ziyaretçi",
            "footer.visitors": "{n} ziyaretçi",

            "profile.headline": "3D Sanatçı ve Oyun Geliştirici",
            "profile.sub": "Anadolu Üniversitesi Heykel öğrencisi",
            "profile.contact": "İletişime geç",
            "profile.note": "Not bırak",

            "about.title": "Hakkında",
            "about.p1": "Selam! Ben Teoman. 20 yaşındayım; tasarımcı ve 3D modelciyim. Birkaç yıldır oyunlar ve dijital projeler için 3D modeller ve ortamlar yapıyorum.",
            "about.p2": "Bir yandan da Anadolu Üniversitesi'nde Heykel okuyorum, yani hem elle hem de bilgisayarda üretiyorum.",
            "about.p3": "Genelde stilize, el boyaması tarzında çalışıyorum. En çok Blender ve Roblox Studio kullanıyorum; Roblox'ta kendi işlerimi kodlayacak kadar da Luau biliyorum.",

            "activity.title": "Son gönderiler",
            "activity.all": "Tüm gönderiler →",
            "activity.empty": "Henüz gönderi yok.",

            "exp.title": "Deneyim",
            "exp.1.title": "3D Sanatçı",
            "exp.1.sub": "Oyunlar ve dijital projeler · Blender",
            "exp.1.text": "Çoğunlukla stilize, el boyaması tarzında 3D modeller ve ortamlar.",
            "exp.2.title": "Roblox Geliştirici",
            "exp.2.sub": "Roblox Studio · Luau",
            "exp.2.text": "Roblox Studio'da oyun ve ortam yapıyorum, kendi sistemlerimi Luau ile kodluyorum.",

            "edu.title": "Eğitim",
            "edu.1.title": "Anadolu Üniversitesi",
            "edu.1.sub": "Heykel",
            "edu.2.title": "Mersin Nevit Kodallı Güzel Sanatlar Lisesi",
            "edu.2.sub": "Güzel Sanatlar",

            "skills.title": "Yetenekler",
            "skill.modeling": "3D Modelleme",
            "skill.environment": "Ortam Tasarımı",
            "skill.handpainted": "El Boyaması Doku",
            "skill.sculpture": "Heykel",

            "contact.title": "İletişim",
            "contact.email": "E-posta",
            "contact.note": "Notlar",
            "contact.note.text": "Siteye not bırak",
            "contact.portfolio": "Portfolyo",
            "contact.gallery": "Sanat galerisi",

            "post.more": "Devamını oku →",
            "post.share": "Linki kopyala",
            "post.copied": "Link kopyalandı",
            "post.edited": "düzenlendi",
            "post.draft": "Taslak",
            "post.tweet": "X'te",
            "post.tweet.title": "X gönderisi",
            "post.notfound": "Bu gönderi yok ya da kaldırılmış.",
            "post.back": "← Tüm gönderiler",
            "posts.title": "Gönderiler",
            "posts.lede": "Güncellemeler, devam eden işler ve paylaştıklarım.",
            "posts.loading": "Gönderiler yükleniyor…",
            "posts.error": "Gönderiler yüklenemedi. Lütfen daha sonra tekrar dene.",

            "notes.title": "Notlar",
            "notes.lede": "Bana bir not bırak — aşağıda herkese görünür. Herkes bir not yazabilir.",
            "notes.name": "Adın",
            "notes.name.ph": "örn. Deniz",
            "notes.message": "Notun",
            "notes.message.ph": "Bir şeyler yaz…",
            "notes.send": "Notu gönder",
            "notes.sending": "Gönderiliyor…",
            "notes.once": "Sadece bir not yazabilirsin.",
            "notes.sent.title": "Notun paylaşıldı!",
            "notes.sent.text": "Yazdığın için teşekkürler. Aşağıda görebilirsin.",
            "notes.loading": "Notlar yükleniyor…",
            "notes.empty": "Henüz not yok. İlk sen yaz!",
            "notes.error": "Notlar yüklenemedi. Lütfen daha sonra tekrar dene.",
            "notes.error.generic": "Bir şeyler ters gitti. Lütfen tekrar dene.",
            "notes.you": "Sen",
            "notes.reply": "Swaxilep yanıtladı",
            "notes.count.one": "1 not",
            "notes.count": "{n} not",
            "notes.offline": "Veritabanı bağlı değil, şu an not yazılamıyor.",

            "admin.title": "Yönetim paneli",
            "admin.login.title": "Giriş yap",
            "admin.email": "E-posta",
            "admin.password": "Şifre",
            "admin.login": "Giriş yap",
            "admin.logout": "Çıkış yap",
            "admin.login.error": "E-posta ya da şifre yanlış, veya bu hesap yönetici değil.",
            "admin.noconfig": "config.js içinde Supabase ayarlı değil, yönetim paneli çalışamaz.",
            "admin.tab.posts": "Gönderiler",
            "admin.tab.notes": "Notlar",
            "admin.new": "Yeni gönderi",
            "admin.editing": "Gönderiyi düzenle",
            "admin.f.title": "Başlık (isteğe bağlı)",
            "admin.f.body": "Metin",
            "admin.f.body.hint": "**kalın**, *italik*, [link](https://…), liste için “- ”, başlık için “# ”. Boş satır yeni paragraf başlatır.",
            "admin.f.tweet": "Link (isteğe bağlı)",
            "admin.f.tweet.ph": "https://…",
            "admin.f.tweet.hint": "Her link olur. X (Twitter) gönderi linkleri görselleriyle gömülür, diğer linkler kart olarak görünür.",
            "admin.f.date": "Paylaşım tarihi",
            "admin.f.image": "Görsel (isteğe bağlı)",
            "admin.f.upload": "Görsel yükle",
            "admin.f.image.ph": "…ya da görsel linki yapıştır (https://)",
            "admin.f.remove": "Görseli kaldır",
            "admin.f.published": "Yayında (taslak olarak tutmak için işareti kaldır)",
            "admin.save": "Kaydet",
            "admin.cancel": "Vazgeç",
            "admin.saving": "Kaydediliyor…",
            "admin.saved": "Kaydedildi!",
            "admin.uploading": "Yükleniyor…",
            "admin.upload.error": "Yükleme başarısız. supabase-posts.sql dosyasını çalıştırdın mı? Görsel linki de yapıştırabilirsin.",
            "admin.upload.big": "Bu görsel 5 MB'tan büyük.",
            "admin.required": "En azından bir başlık, metin ya da link gir.",
            "admin.tweet.bad": "Link http:// ya da https:// ile başlamalı.",
            "admin.image.bad": "Görsel linki https:// ile başlamalı.",
            "admin.error": "Bir şeyler ters gitti: {msg}",
            "admin.posts.list": "Gönderilerin",
            "admin.posts.empty": "Henüz gönderi yok. İlkini yukarıdan yaz.",
            "admin.posts.missing": "Gönderi tablosu yok ya da güncel değil — Supabase → SQL Editor'da supabase-posts.sql dosyasını çalıştır.",
            "admin.edit": "Düzenle",
            "admin.view": "Görüntüle",
            "admin.delete": "Sil",
            "admin.delete.post": "Bu gönderi silinsin mi? Geri alınamaz.",
            "admin.delete.note": "Bu not silinsin mi? Geri alınamaz.",
            "admin.notes.empty": "Henüz not yok.",
            "admin.reply.ph": "Bir yanıt yaz…",
            "admin.gif.ph": "GIF linki (isteğe bağlı, https://)",
            "admin.reply.save": "Yanıtı kaydet",
        },
    };

    const config = window.SITE_CONFIG || {};
    const listeners = [];
    const SITE = {
        lang: "en",
        config,
        t: (key, vars) => {
            let s = i18n[SITE.lang][key] ?? i18n.en[key] ?? key;
            if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, v); });
            return s;
        },
        onLangChange: (fn) => listeners.push(fn),
    };
    window.SITE = SITE;

    // ─────────────────────────────────────────
    // 2. SUPABASE
    // ─────────────────────────────────────────
    SITE.db = config.supabaseUrl && config.supabaseAnonKey && window.supabase
        ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: { persistSession: true, autoRefreshToken: true },
        })
        : null;

    SITE.user = async () => {
        if (!SITE.db) return null;
        const { data } = await SITE.db.auth.getSession();
        return data.session ? data.session.user : null;
    };

    let adminCheck = null;
    SITE.isAdmin = (fresh = false) => {
        if (!adminCheck || fresh) {
            adminCheck = (async () => {
                const user = await SITE.user();
                if (!user || user.is_anonymous) return false;
                const { data } = await SITE.db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
                return Boolean(data);
            })().catch(() => false);
        }
        return adminCheck;
    };

    // ─────────────────────────────────────────
    // 3. HELPERS
    // ─────────────────────────────────────────
    const escape = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    SITE.escape = escape;

    const locale = () => (SITE.lang === "tr" ? "tr-TR" : "en-GB");
    SITE.number = (n) => new Intl.NumberFormat(locale()).format(n);
    SITE.date = (iso) => new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

    // "3 days ago" for the last month, a full date after that.
    SITE.ago = (iso) => {
        const seconds = (new Date(iso) - Date.now()) / 1000;
        const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" });
        const abs = Math.abs(seconds);
        if (abs < 60) return rtf.format(0, "second");
        if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
        if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
        if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), "day");
        return SITE.date(iso);
    };

    SITE.initial = (name) => (String(name || "?").trim()[0] || "?").toUpperCase();

    // Small, safe Markdown subset for posts: everything is escaped first, then
    // # headings, - lists, **bold**, *italic*, `code`, [text](https://…) and bare links.
    const inline = (s) => s
        .replace(/`([^`\n]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
        .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, (m, text, href, bare) =>
            `<a href="${href || bare}" target="_blank" rel="noopener noreferrer">${text || bare}</a>`);

    SITE.richText = (src) => escape(src).trim().split(/\n\s*\n/).filter(Boolean).map(block => {
        const heading = block.match(/^(#{1,3})\s+(.+)$/);
        if (heading) return `<h${heading[1].length + 2}>${inline(heading[2])}</h${heading[1].length + 2}>`;
        const lines = block.split("\n");
        if (lines.every(l => /^\s*[-•]\s+/.test(l))) {
            return `<ul>${lines.map(l => `<li>${inline(l.replace(/^\s*[-•]\s+/, ""))}</li>`).join("")}</ul>`;
        }
        return `<p>${inline(block).replace(/\n/g, "<br>")}</p>`;
    }).join("");

    SITE.safeUrl = (url) => (/^https:\/\/[^\s"'<>]+$/.test(url || "") ? url : "");
    SITE.httpUrl = (url) => (/^https?:\/\/[^\s"'<>]+$/.test(url || "") ? url : "");

    // X / Twitter post links → { user, id, url } (url is the canonical x.com form stored in the database).
    SITE.parseTweet = (value) => {
        const m = String(value || "").trim().match(/^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/(\d{1,25})/);
        return m ? { user: m[1], id: m[2], url: `https://x.com/${m[1]}/status/${m[2]}` } : null;
    };

    // ─────────────────────────────────────────
    // 4. HEADER & FOOTER
    // ─────────────────────────────────────────
    const page = document.body.dataset.page || "";
    const navItem = (key, href, label) =>
        `<a href="${href}" data-nav="${key}" data-i18n="${label}"${page === key ? ' aria-current="page"' : ""}${key === "admin" ? " hidden" : ""}></a>`;

    document.body.insertAdjacentHTML("afterbegin", `
        <header class="site-header">
            <div class="wrap header-inner">
                <a href="/" class="brand">Swaxilep</a>
                <nav class="nav" aria-label="Main">
                    ${navItem("profile", "/", "nav.profile")}
                    ${navItem("posts", "/posts", "nav.posts")}
                    ${navItem("notes", "/notes", "nav.notes")}
                    ${navItem("admin", "/admin", "nav.admin")}
                </nav>
                <div class="lang-switch" role="group" aria-label="Language">
                    <button type="button" data-lang="en">EN</button>
                    <button type="button" data-lang="tr">TR</button>
                </div>
            </div>
        </header>`);

    document.body.insertAdjacentHTML("beforeend", `
        <footer class="site-footer">
            <div class="wrap footer-inner">
                <span data-i18n="footer.copy"></span>
                <span id="visitorCount" hidden></span>
            </div>
        </footer>`);

    // Show the Admin link to a logged-in admin.
    if (SITE.db) {
        SITE.isAdmin().then(yes => {
            const link = document.querySelector('.nav [data-nav="admin"]');
            if (link && (yes || page === "admin")) link.hidden = false;
        });
    }

    // ─────────────────────────────────────────
    // 5. LANGUAGE
    // ─────────────────────────────────────────
    const titleKey = document.body.dataset.titleKey || "meta.home";

    const setLang = (next) => {
        if (!i18n[next]) return;
        SITE.lang = next;
        document.documentElement.lang = next;
        document.title = SITE.t(titleKey);
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute("content", SITE.t("meta.description"));

        document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = SITE.t(el.dataset.i18n); });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = SITE.t(el.dataset.i18nPlaceholder); });
        document.querySelectorAll(".lang-switch button").forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.lang === next)));
        try { localStorage.setItem("lang", next); } catch (e) { /* storage unavailable */ }

        listeners.forEach(fn => fn(next));
    };

    document.querySelectorAll(".lang-switch button").forEach(btn => btn.addEventListener("click", () => setLang(btn.dataset.lang)));

    let saved = null;
    try { saved = localStorage.getItem("lang"); } catch (e) { /* storage unavailable */ }
    const browserLang = (navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en";
    setLang(saved || browserLang);

    // ─────────────────────────────────────────
    // 6. VISITOR COUNTER — one per IP (supabase-visitors.sql), shown in the footer
    // ─────────────────────────────────────────
    const counter = document.getElementById("visitorCount");
    let visitors = null;
    const renderVisitors = () => {
        if (visitors === null) return;
        counter.textContent = visitors === 1 ? SITE.t("footer.visitors.one") : SITE.t("footer.visitors", { n: SITE.number(visitors) });
        counter.hidden = false;
    };
    SITE.onLangChange(renderVisitors);

    if (config.supabaseUrl && config.supabaseAnonKey) {
        fetch(`${config.supabaseUrl}/rest/v1/rpc/register_visit`, {
            method: "POST",
            headers: { apikey: config.supabaseAnonKey, "Content-Type": "application/json" },
            body: "{}",
        })
            .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
            .then(n => { visitors = Number(n); renderVisitors(); })
            .catch(() => { /* counter not set up — stays hidden */ });
    }
})();
