document.addEventListener("DOMContentLoaded", () => {

    // ─────────────────────────────────────────
    // 1. TYPEWRITER
    // ─────────────────────────────────────────
    const roles = [
        "Game Developer",
        "3D Artist",
        "Fine Arts Graduate",
        "Blender Artist",
    ];
    let ri = 0, ci = 0, deleting = false;
    const roleEl = document.getElementById("roleText");

    function type() {
        const word = roles[ri];
        if (deleting) {
            roleEl.textContent = word.slice(0, --ci);
        } else {
            roleEl.textContent = word.slice(0, ++ci);
        }
        let speed = deleting ? 35 : 80;
        if (!deleting && ci === word.length) { speed = 2000; deleting = true; }
        else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; speed = 400; }
        setTimeout(type, speed);
    }
    setTimeout(type, 800);

    // ─────────────────────────────────────────
    // 2. INTERSECTION OBSERVER — reveal
    // ─────────────────────────────────────────
    const revealTargets = document.querySelectorAll(
        ".section-header, .about-text, .about-sidebar, " +
        ".connect-card, .tool-group, .stat-block"
    );

    revealTargets.forEach(el => el.classList.add("reveal"));

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const idx = Array.from(revealTargets).indexOf(entry.target);
            setTimeout(() => entry.target.classList.add("visible"), (idx % 6) * 70);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.08 });

    revealTargets.forEach(el => obs.observe(el));

    // ─────────────────────────────────────────
    // 3. SKILL BARS
    // ─────────────────────────────────────────
    const fills = document.querySelectorAll(".tool-fill");
    const barObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.style.width = entry.target.dataset.width + "%";
            barObs.unobserve(entry.target);
        });
    }, { threshold: 0.4 });
    fills.forEach(f => barObs.observe(f));

    // ─────────────────────────────────────────
    // 4. COUNTERS
    // ─────────────────────────────────────────
    const statVals = document.querySelectorAll(".stat-val");
    const countObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count);
            let n = 0;
            const step = Math.max(1, Math.ceil(target / 40));
            const iv = setInterval(() => {
                n = Math.min(n + step, target);
                el.textContent = n;
                if (n >= target) clearInterval(iv);
            }, 40);
            countObs.unobserve(el);
        });
    }, { threshold: 0.5 });
    statVals.forEach(v => countObs.observe(v));

    // ─────────────────────────────────────────
    // 5. REDIRECT MODAL
    // ─────────────────────────────────────────
    const modalOverlay = document.getElementById("modalOverlay");
    const modalUrl = document.getElementById("modalUrl");
    const modalConfirm = document.getElementById("modalConfirm");
    const modalCancel = document.getElementById("modalCancel");
    let pendingUrl = null;

    document.querySelectorAll("a[target='_blank']").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            pendingUrl = link.href;
            modalUrl.textContent = pendingUrl;
            modalOverlay.classList.add("active");
        });
    });

    modalConfirm.addEventListener("click", () => {
        if (pendingUrl) window.open(pendingUrl, "_blank", "noopener");
        modalOverlay.classList.remove("active");
        pendingUrl = null;
    });

    modalCancel.addEventListener("click", () => {
        modalOverlay.classList.remove("active");
        pendingUrl = null;
    });

    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove("active");
            pendingUrl = null;
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            modalOverlay.classList.remove("active");
            pendingUrl = null;
        }
    });

    // ─────────────────────────────────────────
    // 6. SMOOTH SCROLL
    // ─────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", e => {
            const target = document.querySelector(a.getAttribute("href"));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
        });
    });

    // ─────────────────────────────────────────
    // 7. NAV active on scroll
    // ─────────────────────────────────────────
    const navItems = document.querySelectorAll(".nav-item");
    const sections = Array.from(document.querySelectorAll("section[id]"));

    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(sec => {
            if (window.scrollY + 100 >= sec.offsetTop) current = sec.id;
        });
        navItems.forEach(item => {
            const href = item.getAttribute("href").replace("#", "");
            item.style.color = href === current ? "rgba(255,255,255,0.9)" : "";
        });
    });

});
