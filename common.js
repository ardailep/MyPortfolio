// Shared by every page: translations, language switch, nav, scroll reveal, page protection.
// Load this before the page's own script — it applies the language immediately and exposes window.SITE.
(() => {
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
            "hero.lede": "Stylized, hand-painted 3D models for games and interactive worlds — shaped by a sculptor's sense of form.",
            "hero.work": "View my work",
            "hero.about": "About me",
            "mq.1": "Game Developer",
            "mq.2": "3D Artist",
            "mq.3": "Hand-painted Textures",
            "mq.4": "Sculpture",
            "about.title": "Who am I?",
            "about.statement": "A sculptor's eye, <em>translated</em> into polygons.",
            "about.p1": "I'm a passionate designer, modeler, and animator with several years of experience creating <strong>3D assets, environments, and character animations</strong> for games and digital media. I have a strong eye for detail and love bringing ideas to life through design and motion.",
            "about.p2": "Alongside this, I'm studying <strong>Sculpture at Anadolu University,</strong> which gives me a strong foundation in form, volume, composition, and visual language — shaping both my physical work and my digital production.",
            "about.p3": "My focus is stylized, hand-paint–oriented work for games and interactive projects. I work mainly with <strong>Blender and Roblox</strong> and have a working knowledge of Luau to support the production process.",
            "facet.1.title": "Sculpture",
            "facet.1.text": "Studying at Anadolu University — form and volume, from clay to screen.",
            "facet.2.title": "3D &amp; Animation",
            "facet.2.text": "Game-ready assets, environments and character animation with a hand-painted feel.",
            "facet.3.text": "Building and scripting assets straight into the engine.",
            "connect.title": "Let's connect",
            "connect.letters": "Letters",
            "connect.letters.name": "Leave a letter",
            "connect.letters.handle": "one per visitor",
            "connect.portfolio": "Portfolio",
            "connect.social": "Social",
            "connect.chat": "Chat",
            "connect.games": "Games",
            "footer.copy": "© 2026 Swaxilep. All rights reserved.",
            "footer.top": "Back to top",
            "modal.label": "Leaving swaxilep.com",
            "modal.title": "You're heading to an external site",
            "modal.cancel": "Cancel",
            "modal.continue": "Continue",
            roles: ["3D Artist", "Game Developer", "3D Animator", "Sculpture Student", "Blender Artist"],

            "letters.meta.title": "Letters | Swaxilep",
            "letters.nav.home": "Home",
            "letters.eyebrow": "Letter wall",
            "letters.title": "Leave me a <em>letter.</em>",
            "letters.lede": "Write your name and a message — it joins the wall below. Everyone gets exactly one letter, so make it count.",
            "letters.form.name": "Your name",
            "letters.form.name.ph": "e.g. Alex",
            "letters.form.message": "Your message",
            "letters.form.message.ph": "Say hi, share feedback, ask something…",
            "letters.form.send": "Seal & send",
            "letters.form.sending": "Sending…",
            "letters.form.once": "You can only send one letter.",
            "letters.sent.title": "Your letter is on the wall.",
            "letters.sent.text": "Thanks for writing! You've used your one letter — find yours below.",
            "letters.wall.title": "The wall",
            "letters.wall.hint": "Hover an envelope to see who sent it, click to read.",
            "letters.wall.empty": "No letters yet — be the first.",
            "letters.wall.loading": "Collecting letters…",
            "letters.wall.error": "Couldn't load the letters. Please try again later.",
            "letters.from": "From",
            "letters.close": "Close",
            "letters.yours": "yours",
            "letters.error.generic": "Something went wrong. Please try again.",
            "letters.error.already": "You've already sent a letter.",
            "letters.demo": "Demo mode — letters are only saved in this browser until the database is connected.",
        },
        tr: {
            "meta.title": "Swaxilep | Portfolyo",
            "meta.description": "Swaxilep — Oyun Geliştirici ve 3D Sanatçı. Anadolu Üniversitesi Heykel öğrencisi.",
            "nav.about": "Hakkımda",
            "nav.connect": "İletişim",
            "nav.cta": "Merhaba de",
            "hero.eyebrow": "Portfolyo · 2026",
            "hero.prefix": "",
            "hero.lede": "Oyunlar ve interaktif dünyalar için stilize, el boyaması görünümlü 3D modeller — bir heykeltıraşın form duygusuyla.",
            "hero.work": "Çalışmalarım",
            "hero.about": "Hakkımda",
            "mq.1": "Oyun Geliştirici",
            "mq.2": "3D Sanatçı",
            "mq.3": "El Boyaması Dokular",
            "mq.4": "Heykel",
            "about.title": "Ben kimim?",
            "about.statement": "Heykeltıraş bakışı, <em>poligonlara</em> dönüşüyor.",
            "about.p1": "Oyunlar ve dijital medya için <strong>3D varlıklar, ortamlar ve karakter animasyonları</strong> üretme konusunda birkaç yıllık deneyime sahip, işine tutkuyla bağlı bir tasarımcı, modelleyici ve animatörüm. Detaylara dikkat ediyor, fikirleri tasarım ve hareketle hayata geçirmeyi seviyorum.",
            "about.p2": "Bunun yanında <strong>Anadolu Üniversitesi'nde Heykel</strong> okuyorum; bu bana form, hacim, kompozisyon ve görsel dil konusunda güçlü bir temel veriyor ve hem fiziksel çalışmalarımı hem de dijital üretimimi şekillendiriyor.",
            "about.p3": "Odak noktam oyunlar ve interaktif projeler için stilize, el boyaması odaklı işler. Çoğunlukla <strong>Blender ve Roblox</strong> ile çalışıyorum; üretim sürecini desteklemek için temel düzeyde Luau biliyorum.",
            "facet.1.title": "Heykel",
            "facet.1.text": "Anadolu Üniversitesi'nde öğrenim — kilden ekrana form ve hacim.",
            "facet.2.title": "3D &amp; Animasyon",
            "facet.2.text": "El boyaması hissi taşıyan oyuna hazır varlıklar, ortamlar ve karakter animasyonları.",
            "facet.3.text": "Varlıkları doğrudan motorun içinde kurup kodluyorum.",
            "connect.title": "Bağlantı kuralım",
            "connect.letters": "Mektuplar",
            "connect.letters.name": "Mektup bırak",
            "connect.letters.handle": "herkese bir tane",
            "connect.portfolio": "Portfolyo",
            "connect.social": "Sosyal",
            "connect.chat": "Sohbet",
            "connect.games": "Oyunlar",
            "footer.copy": "© 2026 Swaxilep. Tüm hakları saklıdır.",
            "footer.top": "Başa dön",
            "modal.label": "swaxilep.com'dan ayrılıyorsun",
            "modal.title": "Harici bir siteye yönlendiriliyorsun",
            "modal.cancel": "Vazgeç",
            "modal.continue": "Devam et",
            roles: ["3D Sanatçı", "Oyun Geliştirici", "3D Animatör", "Heykel Öğrencisi", "Blender Sanatçısı"],

            "letters.meta.title": "Mektuplar | Swaxilep",
            "letters.nav.home": "Ana sayfa",
            "letters.eyebrow": "Mektup duvarı",
            "letters.title": "Bana bir <em>mektup</em> bırak.",
            "letters.lede": "Adını ve mesajını yaz — aşağıdaki duvara eklensin. Herkesin yalnızca bir mektup hakkı var, iyi değerlendir.",
            "letters.form.name": "Adın",
            "letters.form.name.ph": "örn. Deniz",
            "letters.form.message": "Mesajın",
            "letters.form.message.ph": "Merhaba de, fikrini paylaş, bir şey sor…",
            "letters.form.send": "Mühürle ve gönder",
            "letters.form.sending": "Gönderiliyor…",
            "letters.form.once": "Yalnızca bir mektup gönderebilirsin.",
            "letters.sent.title": "Mektubun duvarda.",
            "letters.sent.text": "Yazdığın için teşekkürler! Tek mektup hakkını kullandın — seninkini aşağıda bulabilirsin.",
            "letters.wall.title": "Duvar",
            "letters.wall.hint": "Kimden geldiğini görmek için zarfın üstüne gel, okumak için tıkla.",
            "letters.wall.empty": "Henüz mektup yok — ilk sen yaz.",
            "letters.wall.loading": "Mektuplar toplanıyor…",
            "letters.wall.error": "Mektuplar yüklenemedi. Lütfen daha sonra tekrar dene.",
            "letters.from": "Gönderen",
            "letters.close": "Kapat",
            "letters.yours": "senin",
            "letters.error.generic": "Bir şeyler ters gitti. Lütfen tekrar dene.",
            "letters.error.already": "Zaten bir mektup gönderdin.",
            "letters.demo": "Demo modu — veritabanı bağlanana kadar mektuplar yalnızca bu tarayıcıda saklanır.",
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
