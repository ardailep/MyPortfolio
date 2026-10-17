document.addEventListener("DOMContentLoaded", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // ─────────────────────────────────────────
    // 1. TYPEWRITER
    // ─────────────────────────────────────────
    const roles = ["3D Artist", "Game Developer", "Fine Arts Graduate", "Blender Artist"];
    const roleEl = document.getElementById("roleText");

    if (!reduceMotion) {
        let ri = 0, ci = roles[0].length, deleting = true;

        const type = () => {
            const word = roles[ri];
            ci += deleting ? -1 : 1;
            roleEl.textContent = word.slice(0, ci);

            let delay = deleting ? 40 : 85;
            if (!deleting && ci === word.length) { delay = 2200; deleting = true; }
            else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 350; }
            setTimeout(type, delay);
        };
        setTimeout(type, 2600);
    }

    // ─────────────────────────────────────────
    // 2. NAV — background on scroll + active link
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
    // 3. REVEAL ON SCROLL (staggered per parent)
    // ─────────────────────────────────────────
    const reveals = document.querySelectorAll(".reveal, .tool-group");
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
    // 4. POINTER EFFECTS — card spotlight + portrait tilt
    // ─────────────────────────────────────────
    if (finePointer && !reduceMotion) {
        document.querySelectorAll(".facet, .tool-group").forEach(card => {
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
    // 5. REDIRECT MODAL
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
