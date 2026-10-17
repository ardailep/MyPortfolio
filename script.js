document.addEventListener("DOMContentLoaded", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

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
            "about.p1": "I am currently studying <strong>Sculpture at Anadolu University,</strong> building a strong foundation in form, volume, composition, and visual language. This shapes both my physical work and my digital production.",
            "about.p2": "On the digital side, I primarily focus on <strong>3D modeling and visual production.</strong> I create stylized, hand-paint–oriented models for games and interactive projects.",
            "about.p3": "I work mainly with <strong>Blender and Roblox</strong> and have a working knowledge of Luau to support the production process.",
            "facet.1.title": "Sculpture",
            "facet.1.text": "Studying at Anadolu University — form and volume, from clay to screen.",
            "facet.2.title": "Stylized 3D",
            "facet.2.text": "Game-ready models with a hand-painted, illustrative feel.",
            "facet.3.text": "Building and scripting assets straight into the engine.",
            "connect.title": "Let's connect",
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
            roles: ["3D Artist", "Game Developer", "Sculpture Student", "Blender Artist"],
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
            "about.p1": "Şu anda <strong>Anadolu Üniversitesi'nde Heykel</strong> okuyorum; form, hacim, kompozisyon ve görsel dil konusunda güçlü bir temel ediniyorum. Bu temel hem fiziksel çalışmalarımı hem de dijital üretimimi şekillendiriyor.",
            "about.p2": "Dijital tarafta ağırlıklı olarak <strong>3D modelleme ve görsel üretim</strong> üzerine çalışıyorum. Oyunlar ve interaktif projeler için stilize, el boyaması odaklı modeller hazırlıyorum.",
            "about.p3": "Çoğunlukla <strong>Blender ve Roblox</strong> ile çalışıyorum; üretim sürecini desteklemek için temel düzeyde Luau biliyorum.",
            "facet.1.title": "Heykel",
            "facet.1.text": "Anadolu Üniversitesi'nde öğrenim — kilden ekrana form ve hacim.",
            "facet.2.title": "Stilize 3D",
            "facet.2.text": "El boyaması, illüstratif hissi olan oyuna hazır modeller.",
            "facet.3.text": "Varlıkları doğrudan motorun içinde kurup kodluyorum.",
            "connect.title": "Bağlantı kuralım",
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
            roles: ["3D Sanatçı", "Oyun Geliştirici", "Heykel Öğrencisi", "Blender Sanatçısı"],
        },
    };

    let lang = "en";
    let roles = i18n.en.roles;
    const roleEl = document.getElementById("roleText");
    const langButtons = document.querySelectorAll(".lang-switch button");

    const setLang = (next) => {
        if (!i18n[next]) return;
        lang = next;
        const dict = i18n[lang];

        document.documentElement.lang = lang;
        document.title = dict["meta.title"];
        document.querySelector('meta[name="description"]').setAttribute("content", dict["meta.description"]);

        document.querySelectorAll("[data-i18n]").forEach(el => {
            const value = dict[el.dataset.i18n];
            if (value !== undefined) el.innerHTML = value;
        });

        langButtons.forEach(btn => btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang)));

        roles = dict.roles;
        restartTypewriter();

        try { localStorage.setItem("lang", lang); } catch (e) { /* storage unavailable */ }
    };

    langButtons.forEach(btn => btn.addEventListener("click", () => setLang(btn.dataset.lang)));

    // ─────────────────────────────────────────
    // 2. TYPEWRITER
    // ─────────────────────────────────────────
    let typeTimer = null;
    let ri = 0, ci = 0, deleting = true;

    const type = () => {
        const word = roles[ri];
        ci += deleting ? -1 : 1;
        roleEl.textContent = word.slice(0, ci);

        let delay = deleting ? 40 : 85;
        if (!deleting && ci === word.length) { delay = 2200; deleting = true; }
        else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 350; }
        typeTimer = setTimeout(type, delay);
    };

    function restartTypewriter() {
        clearTimeout(typeTimer);
        ri = 0;
        roleEl.textContent = roles[0];
        if (reduceMotion) return;
        ci = roles[0].length;
        deleting = true;
        typeTimer = setTimeout(type, 2600);
    }

    let saved = null;
    try { saved = localStorage.getItem("lang"); } catch (e) { /* storage unavailable */ }
    const browserLang = (navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en";
    setLang(saved || browserLang);

    // ─────────────────────────────────────────
    // 3. NAV — background on scroll + active link
    // ─────────────────────────────────────────
    const nav = document.getElementById("nav");
    const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const navLinks = document.querySelectorAll(".nav-links a");
    const sectionObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(link => {
                link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
            });
        });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(s => sectionObs.observe(s));

    // ─────────────────────────────────────────
    // 4. REVEAL ON SCROLL (staggered per parent)
    // ─────────────────────────────────────────
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(el => {
        const siblings = Array.from(el.parentElement.children).filter(c => c.classList.contains("reveal"));
        const i = siblings.indexOf(el);
        if (i > 0) el.style.setProperty("--delay", `${i * 0.08}s`);
    });

    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObs.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    reveals.forEach(el => revealObs.observe(el));

    // ─────────────────────────────────────────
    // 5. POINTER EFFECTS — card spotlight + portrait tilt
    // ─────────────────────────────────────────
    if (finePointer && !reduceMotion) {
        document.querySelectorAll(".facet").forEach(card => {
            card.addEventListener("pointermove", (e) => {
                const r = card.getBoundingClientRect();
                card.style.setProperty("--mx", `${e.clientX - r.left}px`);
                card.style.setProperty("--my", `${e.clientY - r.top}px`);
            });
        });

        const portrait = document.getElementById("portrait");
        portrait.addEventListener("pointermove", (e) => {
            const r = portrait.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            portrait.style.setProperty("--ry", `${x * 10}deg`);
            portrait.style.setProperty("--rx", `${-y * 10}deg`);
        });
        portrait.addEventListener("pointerleave", () => {
            portrait.style.setProperty("--ry", "0deg");
            portrait.style.setProperty("--rx", "0deg");
        });
    }

    // ─────────────────────────────────────────
    // 6. REDIRECT MODAL
    // ─────────────────────────────────────────
    const modal = document.getElementById("modal");
    const modalUrl = document.getElementById("modalUrl");
    const modalConfirm = document.getElementById("modalConfirm");
    const modalCancel = document.getElementById("modalCancel");
    let pendingUrl = null;
    let lastFocus = null;

    const openModal = (url) => {
        pendingUrl = url;
        lastFocus = document.activeElement;
        modalUrl.textContent = url.replace(/^https?:\/\//, "");
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        modalConfirm.focus();
    };

    const closeModal = () => {
        modal.hidden = true;
        document.body.style.overflow = "";
        pendingUrl = null;
        if (lastFocus) lastFocus.focus();
    };

    document.querySelectorAll("a[target='_blank']").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            openModal(link.href);
        });
    });

    modalConfirm.addEventListener("click", () => {
        if (pendingUrl) window.open(pendingUrl, "_blank", "noopener");
        closeModal();
    });
    modalCancel.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    document.addEventListener("keydown", (e) => {
        if (modal.hidden) return;
        if (e.key === "Escape") closeModal();
        if (e.key === "Tab") {
            // keep focus inside the dialog
            const first = modalCancel, last = modalConfirm;
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });
});
