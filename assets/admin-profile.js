// Admin panel → Profile tab: edit everything on the profile page (name, photo, headline, about,
// experience, education, skills, contact links). Saved as one JSON document — see assets/profile.js.
(() => {
    const SITE = window.SITE;
    const P = SITE.profile;
    const db = SITE.db;
    const pane = document.getElementById("profilePane");
    if (!db || !pane) return;
    const t = SITE.t;
    const BUCKET = "post-images";

    let data = null;
    let dirty = false;
    let started = false;
    let notice = "";   // message shown above the form (e.g. table missing)

    // Tiny element builder: h("div", { class: "x", onclick: fn }, child, "text", …)
    const h = (tag, props = {}, ...kids) => {
        const el = document.createElement(tag);
        Object.entries(props).forEach(([k, v]) => {
            if (k === "class") el.className = v;
            else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
            else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
        });
        kids.flat().forEach(c => { if (c != null && c !== false) el.append(c); });
        return el;
    };

    let statusEl = null;
    const setStatus = (text, isError = false) => {
        if (!statusEl) return;
        statusEl.textContent = text || "";
        statusEl.className = isError ? "form-error" : "form-ok";
    };
    const touch = () => { dirty = true; setStatus(""); };
    window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

    // ─────────────────────────────────────────
    // FIELDS
    // ─────────────────────────────────────────
    const input = (value, onInput, { multiline = false, rows = 3, placeholder = "" } = {}) => {
        const el = multiline ? h("textarea", { class: "input", rows }) : h("input", { class: "input", type: "text" });
        el.value = value || "";
        if (placeholder) el.placeholder = placeholder;
        el.addEventListener("input", () => { onInput(el.value); touch(); });
        return el;
    };

    // A { en, tr } value; plain strings from older data become { en: value, tr: "" }.
    const asPair = (v) => (v && typeof v === "object" ? { en: v.en || "", tr: v.tr || "" } : { en: v || "", tr: "" });

    const pairInputs = (pair, opts) => h("div", { class: "pair" },
        ["en", "tr"].map(lang => h("label", { class: "pair-item" },
            h("span", { class: "pair-tag" }, lang.toUpperCase()),
            input(pair[lang], val => { pair[lang] = val; }, opts))));

    const pairField = (label, obj, key, opts = {}) => {
        obj[key] = asPair(obj[key]);
        return h("div", { class: "field" }, h("span", { class: "field-label" }, label), pairInputs(obj[key], opts));
    };

    const textField = (label, obj, key, opts = {}) => h("label", { class: "field" },
        h("span", { class: "field-label" }, label),
        input(obj[key], val => { obj[key] = val; }, opts));

    // A list of items that can be added, removed and reordered.
    const listSection = (title, arr, renderItem, blank, hint) => {
        const box = h("div", { class: "items" });
        const draw = () => {
            box.replaceChildren(...arr.map((item, i) => {
                const move = (d) => {
                    const j = i + d;
                    if (j < 0 || j >= arr.length) return;
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    touch();
                    draw();
                };
                return h("div", { class: "item" },
                    h("div", { class: "item-head" },
                        h("span", { class: "muted small" }, `#${i + 1}`),
                        h("div", { class: "admin-actions" },
                            h("button", { type: "button", class: "btn btn-sm", title: t("admin.p.up"), "aria-label": t("admin.p.up"), disabled: i === 0, onclick: () => move(-1) }, "↑"),
                            h("button", { type: "button", class: "btn btn-sm", title: t("admin.p.down"), "aria-label": t("admin.p.down"), disabled: i === arr.length - 1, onclick: () => move(1) }, "↓"),
                            h("button", { type: "button", class: "btn btn-sm btn-danger", onclick: () => { arr.splice(i, 1); touch(); draw(); } }, t("admin.p.remove")))),
                    renderItem(item, i));
            }));
        };
        draw();
        return h("section", { class: "panel" },
            h("h2", { class: "panel-title" }, title),
            hint ? h("p", { class: "hint section-hint" }, hint) : null,
            box,
            h("button", {
                type: "button", class: "btn btn-sm", onclick: () => {
                    arr.push(blank());
                    touch();
                    draw();
                    const field = box.lastElementChild && box.lastElementChild.querySelector("input, textarea");
                    if (field) field.focus();
                },
            }, t("admin.p.add")));
    };

    // Profile photo: upload to storage or paste a URL.
    const photoField = () => {
        const preview = h("img", { class: "photo-preview", alt: "" });
        const show = () => {
            const src = SITE.safeUrl(data.photo) || (/^shared\/[\w.-]+$/.test(data.photo || "") ? data.photo : "");
            preview.hidden = !src;
            if (src) preview.src = src;
        };
        const url = input(data.photo, val => { data.photo = val.trim(); show(); }, { placeholder: "https://…" });
        const file = h("input", { type: "file", accept: "image/*" });
        file.addEventListener("change", async () => {
            const f = file.files[0];
            file.value = "";
            if (!f) return;
            if (f.size > 5 * 1024 * 1024) { setStatus(t("admin.upload.big"), true); return; }
            const ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
            const path = `profile-${Date.now()}.${ext}`;
            setStatus(t("admin.uploading"));
            const { error } = await db.storage.from(BUCKET).upload(path, f, { cacheControl: "31536000", contentType: f.type });
            if (error) { console.error(error); setStatus(`${t("admin.upload.error")} (${error.message})`, true); return; }
            data.photo = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
            url.value = data.photo;
            show();
            touch();
            setStatus(t("admin.p.photo.uploaded"));
        });
        show();
        return h("div", { class: "field" },
            h("span", { class: "field-label" }, t("admin.p.photo")),
            h("div", { class: "image-row" },
                preview,
                h("label", { class: "btn btn-sm file-btn" }, h("span", {}, t("admin.f.upload")), file),
                url));
    };

    // ─────────────────────────────────────────
    // FORM
    // ─────────────────────────────────────────
    const build = () => {
        const d = data;
        d.experience = d.experience || [];
        d.education = d.education || [];
        d.contacts = d.contacts || [];
        d.skills = (d.skills || []).map(asPair);

        statusEl = h("span", { class: "form-ok", role: "status" });
        const saveBtn = h("button", { type: "submit", class: "btn btn-primary" }, t("admin.p.save"));

        const form = h("form", { class: "admin-stack", novalidate: true },
            notice ? h("p", { class: "form-error" }, notice) : null,
            h("p", { class: "hint" }, t("admin.p.hint")),

            h("section", { class: "panel" },
                h("h2", { class: "panel-title" }, t("admin.p.basics")),
                h("div", { class: "pair" },
                    textField(t("admin.p.name"), d, "name"),
                    textField(t("admin.p.realName"), d, "realName")),
                photoField(),
                pairField(t("admin.p.headline"), d, "headline"),
                pairField(t("admin.p.sub"), d, "sub")),

            h("section", { class: "panel" },
                h("h2", { class: "panel-title" }, t("about.title")),
                pairField(t("admin.p.about"), d, "about", { multiline: true, rows: 9 }),
                h("p", { class: "hint" }, t("admin.p.about.hint"))),

            listSection(t("exp.title"), d.experience, (item) => h("div", {},
                pairField(t("admin.p.title"), item, "title"),
                pairField(t("admin.p.subtitle"), item, "sub"),
                pairField(t("admin.p.text"), item, "text", { multiline: true, rows: 2 })),
            () => ({ title: { en: "", tr: "" }, sub: { en: "", tr: "" }, text: { en: "", tr: "" } })),

            listSection(t("edu.title"), d.education, (item) => h("div", {},
                pairField(t("admin.p.school"), item, "title"),
                pairField(t("admin.p.subtitle"), item, "sub"),
                pairField(t("admin.p.text"), item, "text", { multiline: true, rows: 2 })),
            () => ({ title: { en: "", tr: "" }, sub: { en: "", tr: "" }, text: { en: "", tr: "" } })),

            listSection(t("skills.title"), d.skills, (item) => pairInputs(item), () => ({ en: "", tr: "" })),

            listSection(t("contact.title"), d.contacts, (item) => h("div", {},
                pairField(t("admin.p.label"), item, "label"),
                pairField(t("admin.p.shown"), item, "text"),
                textField(t("admin.p.url"), item, "url", { placeholder: "https://… · mailto:… · /notes" })),
            () => ({ label: { en: "", tr: "" }, text: { en: "", tr: "" }, url: "" }),
            t("admin.p.contacts.hint")),

            h("div", { class: "save-bar" }, statusEl, saveBtn));

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const clean = tidy(data);
            const bad = clean.contacts.find(c => !P.href(c.url));
            if (bad) {
                setStatus(t("admin.p.badlink", { label: P.pick(bad.label) || P.pick(bad.text) || "?" }), true);
                return;
            }
            saveBtn.disabled = true;
            setStatus(t("admin.saving"));
            try {
                await P.save(clean);
                data = clean;
                dirty = false;
                notice = "";
                build();
                setStatus(t("admin.p.saved"));
            } catch (err) {
                console.error(err);
                setStatus(isMissing(err) ? t("admin.p.missing") : t("admin.error", { msg: err.message || String(err) }), true);
                saveBtn.disabled = false;
            }
        });

        pane.replaceChildren(form);
    };

    // Trim every string and drop list items that were left completely empty.
    const isEmpty = (v) => v == null || v === "" || (typeof v === "object" && !Array.isArray(v) && Object.values(v).every(isEmpty));
    const tidy = (v) => {
        if (typeof v === "string") return v.trim();
        if (Array.isArray(v)) return v.map(tidy).filter(x => !isEmpty(x));
        if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, tidy(x)]));
        return v;
    };

    const isMissing = (err) => Boolean(err && ["42P01", "PGRST205", "PGRST200"].includes(err.code));

    // ─────────────────────────────────────────
    // START — when the Profile tab is first opened
    // ─────────────────────────────────────────
    const start = async () => {
        if (started) return;
        started = true;
        pane.replaceChildren(h("p", { class: "status" }, t("posts.loading")));
        try {
            data = P.clone((await P.load()).profile);
        } catch (err) {
            console.error(err);
            data = P.merge(null);
            notice = isMissing(err) ? t("admin.p.missing") : t("admin.error", { msg: err.message || String(err) });
        }
        build();
    };

    document.addEventListener("admin:tab", (e) => { if (e.detail === "tabProfile") start(); });
    SITE.onLangChange(() => { if (data) build(); });
})();
