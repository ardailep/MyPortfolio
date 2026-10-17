// Shared by every page: translations, language switch, nav, scroll reveal, page protection.
// Load this before the page's own script — it applies the language immediately and exposes window.SITE.
(() => {
    // Clean URLs: show /letters instead of /letters.html and / instead of /index.html
    if (location.protocol.startsWith("http")) {
        const clean = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
        if (clean !== location.pathname) history.replaceState(null, "", clean + location.search + location.hash);
    }

    // ─────────────────────────────────────────
    // 1. TRANSLATIONS
    // ─────────────────────────────────────────
    const i18n = {
        en: {
            "meta.title": "Swaxilep | Portfolio",
            "meta.description": "Swaxilep — Game Developer & 3D Artist. Sculpture student at Anadolu University.",
            "nav.about": "About",
            "nav.connect": "Connect",
            "nav.cta": "Say hi",
            "hero.eyebrow": "Portfolio · 2026",
            "hero.prefix": "I'm a",
            "hero.lede": "I make 3D models and environment designs for games. I mostly use Blender and Roblox Studio.",
            "hero.work": "View my work",
            "hero.about": "About me",
            "mq.1": "Game Developer",
            "mq.2": "3D Artist",
            "mq.3": "Animation",
            "mq.4": "Sculpture",
            "about.title": "Who am I?",
            "about.statement": "Hi! I make <em>3D models</em> and animations for games.",
            "about.p1": "I'm 20, and I'm a designer, modeler and animator. I've been making <strong>3D assets, environments and character animations</strong> for games and digital projects for several years now.",
            "about.p2": "I'm also studying <strong>Sculpture at Anadolu University,</strong> so I work on physical pieces as well as digital ones.",
            "about.p3": "I mostly go for a stylized, hand-painted look. I usually work in <strong>Blender and Roblox Studio</strong>, and I know enough Luau to script my own things in Roblox.",
            "facet.1.title": "Sculpture",
            "facet.1.text": "I'm studying it at Anadolu University.",
            "facet.2.title": "3D &amp; Animation",
            "facet.2.text": "Models, environments and character animations for games.",
            "facet.3.text": "I build in Roblox Studio and write scripts in Luau.",
            "connect.title": "Find me",
            "connect.letters": "Letters",
            "connect.letters.name": "Leave a letter",
            "connect.letters.handle": "one per person",
            "connect.portfolio": "Portfolio",
            "connect.social": "Social",
            "connect.gallery": "Art gallery",
            "connect.chat": "Chat",
            "connect.games": "Games",
            "footer.copy": "© 2026 Swaxilep. All rights reserved.",
            "footer.top": "Back to top",
            "modal.label": "Leaving swaxilep.com",
            "modal.title": "You're about to leave the site",
            "modal.cancel": "Cancel",
            "modal.continue": "Continue",
            roles: ["3D Artist", "Game Developer", "3D Animator", "Sculpture Student", "Blender Artist"],

            "letters.meta.title": "Letters | Swaxilep",
            "letters.nav.home": "Home",
            "letters.eyebrow": "Letters",
            "letters.title": "Leave me a <em>letter.</em>",
            "letters.lede": "Write your name and a message and it'll show up below. Everyone can send only one.",
            "letters.form.name": "Your name",
            "letters.form.name.ph": "e.g. Alex",
            "letters.form.message": "Your message",
            "letters.form.message.ph": "Write something…",
            "letters.form.send": "Send",
            "letters.form.sending": "Sending…",
            "letters.form.once": "You can only send one letter.",
            "letters.sent.title": "Your letter was sent!",
            "letters.sent.text": "Thanks for writing. You can see it with the others below.",
            "letters.wall.title": "Letters",
            "letters.wall.hint": "Click an envelope to read it.",
            "letters.wall.empty": "No letters yet. Be the first!",
            "letters.wall.loading": "Loading letters…",
            "letters.wall.error": "Couldn't load the letters. Please try again later.",
            "letters.from": "From",
            "letters.close": "Close",
            "letters.yours": "yours",
            "letters.error.generic": "Something went wrong. Please try again.",
            "letters.error.already": "You've already sent a letter.",
            "letters.demo": "Demo mode — letters are only saved in this browser until the database is connected.",
            "letters.replied": "replied",
            "letters.reply.title": "Reply from Swaxilep",
            "letters.reply.label": "Your reply",
            "letters.reply.ph": "Write a reply…",
            "letters.reply.save": "Save reply",
            "letters.reply.saving": "Saving…",
            "letters.reply.saved": "Saved!",
            "letters.admin.title": "Admin login",
            "letters.admin.email": "Email",
            "letters.admin.password": "Password",
            "letters.admin.login": "Log in",
            "letters.admin.logout": "Log out",
            "letters.admin.on": "Logged in as admin. Open a letter to reply.",
            "letters.admin.error": "Wrong email or password, or this account isn't an admin.",
        },
        tr: {
            "meta.title": "Swaxilep | Portfolyo",
            "meta.description": "Swaxilep — Oyun Geliştirici ve 3D Sanatçı. Anadolu Üniversitesi Heykel öğrencisi.",
            "nav.about": "Hakkımda",
            "nav.connect": "İletişim",
            "nav.cta": "Merhaba de",
            "hero.eyebrow": "Portfolyo · 2026",
            "hero.prefix": "",
            "hero.lede": "Oyunlar için 3D model ve çevre tasarımı yapıyorum. Çoğunlukla Blender ve Roblox Studio kullanıyorum.",
            "hero.work": "Çalışmalarım",
            "hero.about": "Hakkımda",
            "mq.1": "Oyun Geliştirici",
            "mq.2": "3D Sanatçı",
            "mq.3": "Animasyon",
            "mq.4": "Heykel",
            "about.title": "Ben kimim?",
            "about.statement": "Selam! Oyunlar için <em>3D model</em> ve animasyon yapıyorum.",
            "about.p1": "20 yaşındayım; tasarımcı, modelci ve animatörüm. Birkaç yıldır oyunlar ve dijital projeler için <strong>3D modeller, ortamlar ve karakter animasyonları</strong> yapıyorum.",
            "about.p2": "Bir yandan da <strong>Anadolu Üniversitesi'nde Heykel</strong> okuyorum, yani hem elle hem de bilgisayarda üretiyorum.",
            "about.p3": "Genelde stilize, el boyaması tarzında çalışıyorum. En çok <strong>Blender ve Roblox Studio</strong> kullanıyorum; Roblox'ta kendi işlerimi kodlayacak kadar da Luau biliyorum.",
            "facet.1.title": "Heykel",
            "facet.1.text": "Anadolu Üniversitesi'nde okuyorum.",
            "facet.2.title": "3D &amp; Animasyon",
            "facet.2.text": "Oyunlar için model, ortam ve karakter animasyonu.",
            "facet.3.text": "Roblox Studio'da yapıp Luau ile kodluyorum.",
            "connect.title": "Bana ulaş",
            "connect.letters": "Mektuplar",
            "connect.letters.name": "Mektup bırak",
            "connect.letters.handle": "kişi başı bir tane",
            "connect.portfolio": "Portfolyo",
            "connect.social": "Sosyal",
            "connect.gallery": "Sanat galerisi",
            "connect.chat": "Sohbet",
            "connect.games": "Oyunlar",
            "footer.copy": "© 2026 Swaxilep. Tüm hakları saklıdır.",
            "footer.top": "Başa dön",
            "modal.label": "swaxilep.com'dan ayrılıyorsun",
            "modal.title": "Siteden ayrılmak üzeresin",
            "modal.cancel": "Vazgeç",
            "modal.continue": "Devam et",
            roles: ["3D Sanatçı", "Oyun Geliştirici", "3D Animatör", "Heykel Öğrencisi", "Blender Sanatçısı"],

            "letters.meta.title": "Mektuplar | Swaxilep",
            "letters.nav.home": "Ana sayfa",
            "letters.eyebrow": "Mektuplar",
            "letters.title": "Bana bir <em>mektup</em> bırak.",
            "letters.lede": "Adını ve mesajını yaz, aşağıda görünsün. Herkes sadece bir mektup gönderebiliyor.",
            "letters.form.name": "Adın",
            "letters.form.name.ph": "örn. Deniz",
            "letters.form.message": "Mesajın",
            "letters.form.message.ph": "Bir şeyler yaz…",
            "letters.form.send": "Gönder",
            "letters.form.sending": "Gönderiliyor…",
            "letters.form.once": "Sadece bir mektup gönderebilirsin.",
            "letters.sent.title": "Mektubun gönderildi!",
            "letters.sent.text": "Yazdığın için teşekkürler. Aşağıda diğerleriyle birlikte görebilirsin.",
            "letters.wall.title": "Mektuplar",
            "letters.wall.hint": "Okumak için bir zarfa tıkla.",
            "letters.wall.empty": "Henüz mektup yok. İlk sen yaz!",
            "letters.wall.loading": "Mektuplar yükleniyor…",
            "letters.wall.error": "Mektuplar yüklenemedi. Lütfen daha sonra tekrar dene.",
            "letters.from": "Gönderen",
            "letters.close": "Kapat",
            "letters.yours": "senin",
            "letters.error.generic": "Bir şeyler ters gitti. Lütfen tekrar dene.",
            "letters.error.already": "Zaten bir mektup gönderdin.",
            "letters.demo": "Demo modu — veritabanı bağlanana kadar mektuplar yalnızca bu tarayıcıda saklanır.",
            "letters.replied": "yanıtlandı",
            "letters.reply.title": "Swaxilep'in yanıtı",
            "letters.reply.label": "Yanıtın",
            "letters.reply.ph": "Bir yanıt yaz…",
            "letters.reply.save": "Yanıtı kaydet",
            "letters.reply.saving": "Kaydediliyor…",
            "letters.reply.saved": "Kaydedildi!",
            "letters.admin.title": "Yönetici girişi",
            "letters.admin.email": "E-posta",
            "letters.admin.password": "Şifre",
            "letters.admin.login": "Giriş yap",
            "letters.admin.logout": "Çıkış yap",
            "letters.admin.on": "Yönetici olarak giriş yaptın. Yanıtlamak için bir mektup aç.",
            "letters.admin.error": "E-posta ya da şifre yanlış, veya bu hesap yönetici değil.",
        },
    };

    const listeners = [];
    const SITE = {
        lang: "en",
        t: (key) => i18n[SITE.lang][key] ?? i18n.en[key] ?? key,
        onLangChange: (fn) => listeners.push(fn),
    };
    window.SITE = SITE;

    const langButtons = document.querySelectorAll(".lang-switch button");
    const titleKey = document.body.dataset.titleKey || "meta.title";

    const setLang = (next) => {
        if (!i18n[next]) return;
        SITE.lang = next;

        document.documentElement.lang = next;
        document.title = SITE.t(titleKey);
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute("content", SITE.t("meta.description"));

        document.querySelectorAll("[data-i18n]").forEach(el => { el.innerHTML = SITE.t(el.dataset.i18n); });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = SITE.t(el.dataset.i18nPlaceholder); });

        langButtons.forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.lang === next)));
        try { localStorage.setItem("lang", next); } catch (e) { /* storage unavailable */ }

        listeners.forEach(fn => fn(next));
    };

    langButtons.forEach(btn => btn.addEventListener("click", () => setLang(btn.dataset.lang)));

    let saved = null;
    try { saved = localStorage.getItem("lang"); } catch (e) { /* storage unavailable */ }
    const browserLang = (navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en";
    setLang(saved || browserLang);

    // ─────────────────────────────────────────
    // 2. NAV — background on scroll
    // ─────────────────────────────────────────
    const nav = document.getElementById("nav");
    if (nav) {
        const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    // ─────────────────────────────────────────
    // 3. REVEAL ON SCROLL (staggered per parent)
    // ─────────────────────────────────────────
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObs.unobserve(entry.target);
        });
    }, { threshold: 0.12 });

    SITE.reveal = (root = document) => {
        root.querySelectorAll(".reveal:not(.is-visible)").forEach(el => {
            const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains("reveal"));
            const i = siblings.indexOf(el);
            if (i > 0) el.style.setProperty("--delay", `${Math.min(i, 12) * 0.06}s`);
            revealObs.observe(el);
        });
    };
    SITE.reveal();

    // ─────────────────────────────────────────
    // 4. BLOCK RIGHT-CLICK, DEVTOOLS SHORTCUTS & IMAGE DRAG
    // ─────────────────────────────────────────
    document.addEventListener("contextmenu", (e) => {
        if (!e.target.closest("input, textarea")) e.preventDefault();   // keep paste menu in form fields
    });
    document.addEventListener("dragstart", (e) => { if (e.target.tagName === "IMG") e.preventDefault(); });

    document.addEventListener("keydown", (e) => {
        const key = (e.key || "").toUpperCase();
        const ctrl = e.ctrlKey || e.metaKey;
        if (
            key === "F12" ||
            (ctrl && e.shiftKey && ["I", "J", "C"].includes(key)) ||   // inspector / console / element picker
            (ctrl && e.altKey && ["I", "J", "C"].includes(key)) ||     // macOS variants
            (ctrl && key === "U")                                      // view source
        ) {
            e.preventDefault();
        }
    });
})();
