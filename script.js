// Home page only. Translations, nav, reveal and page protection live in common.js.
(() => {
    const SITE = window.SITE;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ─────────────────────────────────────────
    // 1. TYPEWRITER
    // ─────────────────────────────────────────
    const roleEl = document.getElementById("roleText");
    let roles = SITE.t("roles");
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

    const restartTypewriter = () => {
        clearTimeout(typeTimer);
        roles = SITE.t("roles");
        ri = 0;
        roleEl.textContent = roles[0];
        if (reduceMotion) return;
        ci = roles[0].length;
        deleting = true;
        typeTimer = setTimeout(type, 2600);
    };

    restartTypewriter();
    SITE.onLangChange(restartTypewriter);

    // ─────────────────────────────────────────
    // 2. NAV — active link
    // ─────────────────────────────────────────
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
    // 3. REDIRECT MODAL
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
})();
